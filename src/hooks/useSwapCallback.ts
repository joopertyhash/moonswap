import { BigNumber } from '@ethersproject/bignumber'
import { Contract } from '@ethersproject/contracts'
import { JSBI, TokenAmount, Trade } from '@uniswap/sdk'
import { useMemo } from 'react'
import {
  // INITIAL_ALLOWED_SLIPPAGE,
  REFERRAL_ADDRESS_STORAGE_KEY } from '../constants'
import { getTradeVersion } from '../data/V1'
import { TransactionAdder, useTransactionAdder } from '../state/transactions/hooks'
import { calculateGasMargin, getMooniswapContract, getOneSplit, isUseOneSplitContract } from '../utils'
import { useActiveWeb3React } from './index'

import {
  FLAG_DISABLE_ALL_SPLIT_SOURCES,
  FLAG_DISABLE_ALL_WRAP_SOURCES,
  FLAG_DISABLE_MOONISWAP_ALL, FLAG_ENABLE_CHI_BURN
} from '../constants/one-split'
import { getAddress, isAddress } from '@ethersproject/address'


// function isZero(hexNumber: string) {
//   return /^0x0*$/.test(hexNumber)
// }

const bitwiseOrOnJSBI = (items: JSBI[]): JSBI => {
  return items.reduce((acc, val) => {
    return JSBI.add(acc, val)
  }, JSBI.BigInt(0x0))
}

function oneSplitSwapArgs(params: UseSwapCallbackParams, useCHI: boolean): any[] {
  const { trade, allowedSlippage, fromAmount, distribution } = params

  const flags = bitwiseOrOnJSBI([
    FLAG_DISABLE_ALL_WRAP_SOURCES,
    FLAG_DISABLE_ALL_SPLIT_SOURCES,
    FLAG_DISABLE_MOONISWAP_ALL,
    useCHI ? FLAG_ENABLE_CHI_BURN : JSBI.BigInt(0)
  ])

  return [
    trade.inputAmount.token.address,
    trade.outputAmount.token.address,
    fromAmount?.raw.toString(),
    fromAmount.multiply(String(10000 - allowedSlippage)).divide(String(10000)).toFixed(0),
    distribution.map(x => x.toString()),
    flags
  ]
}

function directSwapArgs(params: UseSwapCallbackParams): any[] {

  const { trade, allowedSlippage, fromAmount } = params

  const minReturn = BigNumber.from(trade.outputAmount.raw.toString())
    .mul(String(10000 - allowedSlippage)).div(String(10000))

  //
  const referalAddressStr = localStorage.getItem(REFERRAL_ADDRESS_STORAGE_KEY)
  let referalAddress = '0x68a17B587CAF4f9329f0e372e3A78D23A46De6b5'
  if (referalAddressStr && isAddress(referalAddressStr)) {
    referalAddress = getAddress(referalAddressStr)
  }
  //

  return [
    trade.inputAmount.token.address,
    trade.outputAmount.token.address,
    fromAmount?.raw.toString(),
    minReturn.toString(),
    referalAddress
  ]
}

async function estimateSwap(contract: Contract, args: any[], ethValue: BigNumber | undefined): Promise<BigNumber | undefined> {

  const ethValueArg = ethValue && !ethValue.isZero()
    ? { ethValue }
    : {}

  return contract.estimateGas['swap'](...args, ethValueArg)
    .then(calculateGasMargin)
    .catch((error) => {
      console.error(`estimateGas failed for ${'swap'}`, error)
      return undefined
    })
}

async function doSwap(
  contract: Contract,
  trade: Trade,
  gasEstimate: () => Promise<BigNumber | undefined>,
  value: BigNumber| undefined,
  args: any[],
  addTransaction: TransactionAdder
) {

  const safeGasEstimate = await gasEstimate()
  if (!safeGasEstimate) {
    return
  }

  return contract['swap'](...args, {
    gasLimit: safeGasEstimate,
    ...(value && !value.isZero() ? { value } : {})
  })
    .then((response: any) => {
      const inputSymbol = trade.inputAmount.token.symbol
      const outputSymbol = trade.outputAmount.token.symbol
      const inputAmount = trade.inputAmount.toSignificant(3)
      const outputAmount = trade.outputAmount.toSignificant(3)

      // const base = `Swap ${inputAmount} ${inputSymbol} for ${outputAmount} ${outputSymbol}`
      // const withRecipient = base
      // const withVersion =
      //   tradeVersion === Version.v2 ? withRecipient : `${withRecipient} on ${(tradeVersion as any).toUpperCase()}`

      addTransaction(response, {
        summary: `Swap ${inputAmount} ${inputSymbol} for ${outputAmount} ${outputSymbol}`
      })

      return response.hash
    })
    .catch((error: any) => {
      // if the user rejected the tx, pass this along
      if (error?.code === 4001) {
        throw error
      }
      // otherwise, the error was unexpected and we need to convey that
      else {
        console.error(`Swap failed`, error, 'swap', args, value)
        throw Error('An error occurred while swapping. Please contact support.')
      }
    })
}

type UseSwapHookResult = null | {
  swap: () => Promise<string>,
  estimatePriceWithCHI: () => void,
  estimatePriceWithoutCHI: () => void
}

export type UseSwapCallbackParams = {
  fromAmount: TokenAmount,
  trade: Trade, // trade to execute, required
  distribution: BigNumber[],
  allowedSlippage: number, // in bips
}

// returns a function that will execute a swap, if the parameters are all valid
// and the user has approved the slippage adjusted input amount for the trade
export function useSwapCallback(params: Partial<UseSwapCallbackParams>): Partial<UseSwapHookResult> {

  const {
    fromAmount,
    trade,
    distribution,
    // allowedSlippage = INITIAL_ALLOWED_SLIPPAGE
  } = params

  const { account, chainId, library } = useActiveWeb3React()
  const addTransaction = useTransactionAdder()

  const isOneSplit = isUseOneSplitContract(distribution)

  const recipient = account

  const tradeVersion = getTradeVersion(trade)
  // const v1Exchange = useV1ExchangeContract(useV1TradeExchangeAddress(trade), true)

  return useMemo(() => {
    if (!trade || !recipient || !library || !account || !tradeVersion || !chainId || !distribution || !fromAmount || !params) {
      return {}
    }

    // const contract: Contract | null = isOneSplit
    //   ? getOneSplit(chainId, library, account)
    //   : getMooniswapContract(chainId, library, trade.route.pairs[0].poolAddress, account)

    const value = trade.inputAmount.token.symbol === 'ETH'
      ? BigNumber.from(fromAmount.raw.toString())
      : undefined


    // Direct swap - mooniswap contract
    if (!isOneSplit) {
      const contract = getMooniswapContract(chainId, library, trade.route.pairs[0].poolAddress, account)
      if (!contract) {
        throw new Error('Failed to get a swap contract')
      }
      const args = directSwapArgs(params as UseSwapCallbackParams)

      // TODO: use effect
      // const gasWithoutCHI = await estimateSwap(contract, args, value);
      const estimatePriceWithoutCHI = () => estimateSwap(contract, args, value)
      return {
        swap: () => doSwap(contract, trade, estimatePriceWithoutCHI, value, args, addTransaction),
        estimatePriceWithCHI: () => {},
        estimatePriceWithoutCHI: () => {
        } // gasWithoutCHI.toNumber()
      }
    }

    // One Split with CHI
    const contract: Contract = getOneSplit(chainId, library, account)

    // const argsWithCHI = oneSplitSwapArgs(params as UseSwapCallbackParams, true)
    const argsWithoutCHI = oneSplitSwapArgs(params as UseSwapCallbackParams, false)
    const estimatePriceWithoutCHI = () => estimateSwap(contract, argsWithoutCHI, value)

    // const gasWithoutCHI = estimateSwap(contract, args, value)
    // const gasWithCHI = estimateSwap(contract, args, value)

    // if (BigNumber.isBigNumber(safeGasEstimate) && !BigNumber.isBigNumber(safeGasEstimate)) {
    //   throw new Error(
    //     'An error occurred. Please try raising your slippage. If that does not work, contact support.'
    //   )
    // }

    return {
      swap: () => doSwap(contract, trade, estimatePriceWithoutCHI, value, argsWithoutCHI, addTransaction),
      estimatePriceWithCHI: () => {},
      estimatePriceWithoutCHI: () => {
      } // gasWithoutCHI.toNumber()
    }

  }, [
    params,
    trade,
    recipient,
    library,
    account,
    tradeVersion,
    chainId,
    // allowedSlippage,
    addTransaction,
    distribution,
    fromAmount,
    isOneSplit,
  ])
}
