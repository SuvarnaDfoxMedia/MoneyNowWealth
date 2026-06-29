import FundListing from '@/components/Mutual-Funds-Master-Category/FundListing'
import React from 'react'

export const metadata = {
  title: 'Mutual Funds | Screener',
  description: 'Filter and discover the best mutual funds.',
}

const page = () => {
  return (
    <div>
      <FundListing/>
    </div>
  )
}

export default page
