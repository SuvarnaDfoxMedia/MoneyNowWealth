import MFMainCategory from '@/components/Mutual-Funds-Master-Category/MF-Main-Category'
import React from 'react'

export const metadata = {
  title: 'Mutual Funds | Explore',
  description: 'Explore mutual funds across categories, popular funds, and NFOs.',
}

const page = () => {
  return (
    <div>
      <MFMainCategory/>
    </div>
  )
}

export default page
