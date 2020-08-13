import { useWeb3React } from '@web3-react/core'
import { useHasChi } from '../../hooks/useChi'
import { ApprovalState, useApproveCallback } from '../../hooks/useApproveCallback'
import { TokenAmount } from '@uniswap/sdk'
import { CHI } from '../../constants'
import JSBI from 'jsbi'
import { MaxUint256 } from '@ethersproject/constants'
import { ONE_SPLIT_ADDRESSES } from '../../constants/one-split'
import React, { useContext } from 'react'
import { RowBetween, RowFixed } from '../Row'
import { TYPE } from '../../theme'
import Toggle from '../Toggle'
import { ThemeContext } from 'styled-components'

export function ChiRow() {

  const { chainId } = useWeb3React()
  const MIN_CHI_BALANCE = 5
  const hasChi = useHasChi(0)
  const hasEnoughChi = useHasChi(MIN_CHI_BALANCE)

  const [approvalState] = useApproveCallback(
    new TokenAmount(CHI, JSBI.BigInt(MaxUint256)),
    ONE_SPLIT_ADDRESSES[chainId]
  )

  const successMessage = 'CHI token is activated!'
  let tooltipText = successMessage
  if (!hasChi || approvalState !== ApprovalState.APPROVED) {
    tooltipText = `Activate CHI gas token in settings to pay less fees on ethereum transactions`
  } else if (!hasEnoughChi) {
    tooltipText = `Your CHI balance become too small`
  }

  const enabled = tooltipText === successMessage
  const theme = useContext(ThemeContext)

  return (
    <RowBetween>
      <RowFixed>
        <TYPE.black fontWeight={400} fontSize={14} color={theme.text2}>
          Activate CHI
        </TYPE.black>
      </RowFixed>
      {/*<Toggle isActive={darkMode} toggle={toggleDarkMode}/>*/}
    </RowBetween>
  )
}
