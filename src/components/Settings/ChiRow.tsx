import { useWeb3React } from '@web3-react/core'
import { useHasChi, useIsChiApproved } from '../../hooks/useChi'
import { ApprovalState } from '../../hooks/useApproveCallback'
import React, { useContext } from 'react'
import { RowBetween, RowFixed } from '../Row'
import { TYPE } from '../../theme'
import Toggle from '../Toggle'
import { ThemeContext } from 'styled-components'
import { useLocalStorage } from '../../hooks/useLocalStorage'

export function ChiStateControl({ state, approveCHI }) {

  const isApproved = state === ApprovalState.APPROVED;
  const [chiEnabledFlag, setChiEnabledFlag]
    = useLocalStorage('chiEnabled', false)

  if (state === ApprovalState.UNKNOWN) {
    return (
      <>
        'loading'
      </>
    )
  }

  if (state === ApprovalState.PENDING) {
    return (
      <>
        'pending'
      </>
    )
  }

  return (
    <Toggle isActive={isApproved && chiEnabledFlag} toggle={() => {
      const newValue = !chiEnabledFlag;
      setChiEnabledFlag(newValue)
      if(newValue === true && !isApproved) {
        approveCHI();
      }
    }}/>
  )
}

export function ChiRow() {

  const { chainId } = useWeb3React()
  const hasChi = useHasChi(0)
  const [approvalState, approveCHI] = useIsChiApproved(chainId);

  const theme = useContext(ThemeContext)

  return (
    <RowBetween>
      <RowFixed>
        <TYPE.black fontWeight={400} fontSize={14} color={theme.text2}>
          {
            hasChi ? 'Activate CHI' : `Don't have CHI to activate`
          }
        </TYPE.black>
      </RowFixed>
      {
        hasChi
          ? <ChiStateControl state={approvalState} approveCHI={approveCHI}/>
          : ''
      }

    </RowBetween>
  )
}





