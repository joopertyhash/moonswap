import { useUniswapV2HelperContract, useUniswapV2PairContract } from '../hooks/useContract'
import { useMemo } from 'react'
import { NEVER_RELOAD, useSingleCallResult, useSingleContractMultipleData } from '../state/multicall/hooks'
import { BigNumber } from '@ethersproject/bignumber'
import { Token } from '@uniswap/sdk'

export interface UniswapV2Pair {
  pair: string
  token0: string,
  token1: string,
  balance: BigNumber
}

// returns all Uniswapv2 exchange addresses in the user's token list
export function useAllUniswapV2Pairs(account: string): [UniswapV2Pair[], boolean] {
  const helper = useUniswapV2HelperContract()

  const res = useSingleCallResult(helper, 'getAllPairsWithBalances', [account], NEVER_RELOAD)

  return useMemo(
    () => {
      const data = res?.result?.pairsWithBalances?.reduce((acc: any, pair: any) => {
          const p = {
            pair: pair.id,
            token0: pair.token0,
            token1: pair.token1,
            balance: pair.walletBalance
          };
          acc.push(p)
          return acc
      }, [])

      return [data || [], res?.loading]
    },
    [account, res]
  )
}

export function usePairTokens(pairAddress: string | undefined): string[] {
  const contract = useUniswapV2PairContract(pairAddress)

  const res0 = useSingleCallResult(contract, 'token0', [], NEVER_RELOAD)
  const res1 = useSingleCallResult(contract, 'token1', [], NEVER_RELOAD)

  return useMemo(() => {
    if (res0?.result?.[0] && res1?.result?.[0]) {
      return [res0.result[0], res1.result[0]]
    }
    return []
  },
  [contract, res0, res1])
}
