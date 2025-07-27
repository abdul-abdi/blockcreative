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
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 py-6 sm:py-8 md:py-10 px-3 sm:px-4 md:px-6 flex flex-col items-center">
      {/* Header Section */}
      <div className="w-full max-w-4xl text-center mb-6 sm:mb-8 md:mb-10">
        <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-3 sm:mb-4">
          Choose Your Premium Plan
        </h1>
        <p className="text-gray-300 text-sm sm:text-base md:text-lg max-w-2xl mx-auto">
          Select the perfect plan for your audio content needs
        </p>
      </div>

      {/* Plans Grid */}
      <div className="w-full max-w-7xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
        {plans.map((plan) => (
          <TiltedCard
            key={plan.name}
            containerHeight="400px"
            containerWidth="100%"
            rotateAmplitude={8}
            scaleOnHover={1.05}
            showMobileWarning={false}
            showTooltip={false}
            displayOverlayContent={true}
            cardBackground="bg-gradient-to-br from-gray-800 to-gray-900"
            cardBorder="border-2 border-blue-400"
            overlayContent={
              <div className="flex flex-col items-center justify-between h-full p-3 sm:p-4 md:p-5">
                {/* Plan Header */}
                <div className="text-center mb-2 sm:mb-3">
                  <h2 className="text-base sm:text-lg md:text-xl font-semibold mb-1 sm:mb-2 text-blue-300">
                    {plan.name}
                  </h2>
                  <div className="text-xl sm:text-2xl md:text-3xl font-bold text-blue-400 mb-1">
                    {plan.price} USDT
                  </div>
                  <p className="text-gray-300 text-xs sm:text-sm text-center leading-relaxed">
                    {plan.description}
                  </p>
                </div>

                {/* Features List */}
                <div className="flex-1 w-full mb-3 sm:mb-4 overflow-y-auto">
                  <ul className="text-xs sm:text-sm text-gray-200 space-y-1">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start">
                        <span className="text-blue-400 mr-2 mt-0.5 flex-shrink-0">✓</span>
                        <span className="leading-relaxed break-words">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* CTA Button */}
                <button className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg font-semibold hover:from-blue-700 hover:to-blue-800 transition-all duration-200 transform hover:scale-105 text-xs sm:text-sm">
                  Choose Plan
                </button>
              </div>
            }
          />
        ))}
      </div>

      {/* Additional Info Section */}
      <div className="w-full max-w-4xl mt-8 sm:mt-10 md:mt-12 text-center">
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 sm:p-6 md:p-8 border border-gray-700">
          <h3 className="text-lg sm:text-xl md:text-2xl font-semibold text-white mb-3 sm:mb-4">
            All Plans Include
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 text-sm sm:text-base text-gray-300">
            <div className="flex items-center justify-center sm:justify-start">
              <span className="text-green-400 mr-2">✓</span>
              High-quality audio streaming
            </div>
            <div className="flex items-center justify-center sm:justify-start">
              <span className="text-green-400 mr-2">✓</span>
              Cross-platform access
            </div>
            <div className="flex items-center justify-center sm:justify-start">
              <span className="text-green-400 mr-2">✓</span>
              Secure payment processing
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default page
