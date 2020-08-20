import React from 'react'
import { Text } from 'rebass'
import { Route } from '@uniswap/sdk'

export default function ChiDiscount({route}: {route: Route}) {

  return (
    <div>
      <Text textAlign="center" fontSize={14} style={{ padding: '.5rem 0 .5rem 0' }}>
        {route?.path?.length > 2 ? 'CHI' : 'NO'}
      </Text>
    </div>
  )
}
