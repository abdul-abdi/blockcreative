import React from 'react'
import TiltedCard from '@/components/TiltedCard';

const plans = [
  {
    name: 'Basic',
    price: 3, // USDT
    description: 'Access to basic features and limited downloads.',
    features: ['Basic support', 'Limited downloads', 'Ad-supported'],
    imageSrc: 'https://i.scdn.co/image/ab67616d0000b273d9985092cd88bffd97653b58',
    altText: 'Basic Plan',
  },
  {
    name: 'Standard',
    price: 6,
    description: 'Enjoy ad-free listening and unlimited downloads.',
    features: ['Ad-free', 'Unlimited downloads', 'Priority support'],
    imageSrc: 'https://i.scdn.co/image/ab67616d0000b273d9985092cd88bffd97653b58',
    altText: 'Standard Plan',
  },
  {
    name: 'Family',
    price: 10,
    description: 'Up to 6 accounts. Perfect for families.',
    features: ['6 accounts', 'Parental controls', 'Ad-free'],
    imageSrc: 'https://i.scdn.co/image/ab67616d0000b273d9985092cd88bffd97653b58',
    altText: 'Family Plan',
  },
  {
    name: 'Student',
    price: 2,
    description: 'Discounted plan for students with all premium features.',
    features: ['All premium features', 'Student verification required'],
    imageSrc: 'https://i.scdn.co/image/ab67616d0000b273d9985092cd88bffd97653b58',
    altText: 'Student Plan',
  },
];

const page = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 py-10 px-4 flex flex-col items-center">
      <h1 className="text-3xl md:text-4xl font-bold mb-8 text-center text-white">Choose Your Premium Plan</h1>
      <div className="w-full max-w-5xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {plans.map((plan) => (
          <TiltedCard
            key={plan.name}
            containerHeight="350px"
            containerWidth="100%"
            rotateAmplitude={12}
            scaleOnHover={1.08}
            showMobileWarning={false}
            showTooltip={false}
            displayOverlayContent={true}
            cardBackground="bg-gradient-to-br from-gray-800 to-gray-900"
            cardBorder="border-2 border-blue-400"
            overlayContent={
              <div className="flex flex-col items-center justify-between h-full p-2">
                <h2 className="text-xl font-semibold mb-2 text-blue-300">{plan.name}</h2>
                <div className="text-3xl font-bold text-blue-400 mb-1">{plan.price} USDT</div>
                <p className="text-gray-300 mb-4 text-center">{plan.description}</p>
                <ul className="mb-6 text-sm text-gray-200 list-disc list-inside">
                  {plan.features.map((feature) => (
                    <li key={feature}>{feature}</li>
                  ))}
                </ul>
                <button className="mt-auto bg-blue-600 text-white px-5 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors w-full">Choose Plan</button>
              </div>
            }
          />
        ))}
      </div>
    </div>
  )
}

export default page
