const plans = [
  {
    id: 'plan_basic',
    name: 'Basic',
    description: 'Good for individuals. Billed monthly.',
    priceMonthly: 500, // in cents => $5.00
    interval: 'month',
    priceId: 'price_1SUR0L2NNYJgedtoCEf9xC3w'
  },
  {
    id: 'plan_standard',
    name: 'Standard',
    description: 'Most popular. Includes extra features.',
    priceMonthly: 1500, // $15.00
    interval: 'month',
    priceId: 'price_1SUR2b2NNYJgedtoeF9A4Cpi'
  },
  {
    id: 'plan_premium',
    name: 'Premium',
    description: 'For teams and power users.',
    priceMonthly: 3000, // $30.00
    interval: 'month',
    priceId: 'price_1SUR342NNYJgedtoQZ58qPfj'
  }
];

export default plans;
