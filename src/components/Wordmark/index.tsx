import React from 'react'
import { MEDIA_WIDTHS } from '../../theme'
import styled from 'styled-components'

const WordmarkStyled = styled.div`
  @import url('https://fonts.googleapis.com/css2?family=Quicksand&display=swap');

  color: ${({ theme }) => theme.text1};

  .mainWordmark {
    font-family: Quicksand, serif;
    margin-top: 5px;
    margin-bottom: 5px;
    font-size: 40px;
    font-weight: normal;
  }
  
  .mainHeader {
    font-family: Quicksand, serif;
    text-transform: uppercase;
    margin-top: 0;
    margin-bottom: 20px;
    font-weight: 400;
  }
  
  a {
    color: ${({ theme }) => theme.text1};
  }
  
  @media (max-width: ${(MEDIA_WIDTHS as any)['upToSmall']}px) {
  .mainWordmark {
    margin-top: 0;
    margin-bottom: 0;
    text-align: left;
    font-size: 24px;
  }
  
  .mainHeader {
    font-family: Quicksand, serif;
    text-align: left;
    margin-bottom: 0;
    font-size: 12px;
    margin-top: 7px;
    margin-bottom: 7px;
    width: 260px;
  }
  
  @media (max-width: ${(MEDIA_WIDTHS as any)['upToTheSmallest']}px) {
    .mainHeader {
      font-size: 10px;
    }
  }
}
`

export default function Wordmark() {
  return (
    <WordmarkStyled>
      <h1 className="mainWordmark">Mooniswap</h1>
      <h4 className="mainHeader">Next generation AMM protocol by {' '}
        <a href="https://1inch.exchange/" target="_blank" rel="noopener noreferrer">1inch</a></h4>
    </WordmarkStyled>
  )
}
