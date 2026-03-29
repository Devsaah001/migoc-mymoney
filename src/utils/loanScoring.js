export function calculateLoanEligibilityScore(customer = {}, loan = {}) {
  const balance = Number(customer.balance || 0);
  const totalContributions = Number(customer.totalContributions || 0);
  const completedCycles = Number(customer.completedCycles || 0);
  const missedContributions = Number(customer.missedContributions || 0);
  const totalPayouts = Number(customer.totalPayouts || 0);

  const previousLoansCount = Number(customer.previousLoansCount || 0);
  const completedLoansCount = Number(customer.completedLoansCount || 0);
  const overdueLoansCount = Number(customer.overdueLoansCount || 0);
  const defaultedLoansCount = Number(customer.defaultedLoansCount || 0);

  const requestedLoanAmount = Number(loan.loanAmount || 0);

  let score = 0;

  // Savings behavior
  if (balance >= 500) score += 20;
  else if (balance >= 300) score += 16;
  else if (balance >= 150) score += 12;
  else if (balance >= 50) score += 8;
  else if (balance > 0) score += 4;

  // Contributions consistency
  if (totalContributions >= 90) score += 20;
  else if (totalContributions >= 60) score += 16;
  else if (totalContributions >= 30) score += 12;
  else if (totalContributions >= 15) score += 8;
  else if (totalContributions > 0) score += 4;

  // Completed susu cycles
  if (completedCycles >= 3) score += 15;
  else if (completedCycles === 2) score += 12;
  else if (completedCycles === 1) score += 8;

  // Missed contributions penalty
  if (missedContributions === 0) score += 15;
  else if (missedContributions <= 2) score += 8;
  else if (missedContributions <= 5) score += 3;
  else score -= 8;

  // Loan history
  if (previousLoansCount === 0) {
    score += 8;
  } else {
    score += completedLoansCount * 6;
    score -= overdueLoansCount * 8;
    score -= defaultedLoansCount * 15;
  }

  // Requested amount vs current savings
  if (requestedLoanAmount > 0) {
    if (balance >= requestedLoanAmount) score += 12;
    else if (balance >= requestedLoanAmount * 0.7) score += 8;
    else if (balance >= requestedLoanAmount * 0.5) score += 5;
    else if (balance >= requestedLoanAmount * 0.25) score += 2;
    else score -= 10;
  }

  // Clamp score
  score = Math.max(0, Math.min(100, score));

  let grade = 'High Risk';
  let recommendation = 'reject';
  let maxEligibleAmount = 0;

  if (score >= 80) {
    grade = 'Excellent';
    recommendation = 'approve';
    maxEligibleAmount = Math.max(balance * 2, requestedLoanAmount);
  } else if (score >= 65) {
    grade = 'Good';
    recommendation = 'approve_with_review';
    maxEligibleAmount = Math.max(balance * 1.5, requestedLoanAmount * 0.9);
  } else if (score >= 50) {
    grade = 'Fair';
    recommendation = 'manual_review';
    maxEligibleAmount = balance;
  } else if (score >= 35) {
    grade = 'Weak';
    recommendation = 'high_risk_review';
    maxEligibleAmount = balance * 0.5;
  } else {
    grade = 'High Risk';
    recommendation = 'reject';
    maxEligibleAmount = balance * 0.25;
  }

  return {
    score,
    grade,
    recommendation,
    maxEligibleAmount: Number(maxEligibleAmount.toFixed(2)),
    factors: {
      balance,
      totalContributions,
      completedCycles,
      missedContributions,
      totalPayouts,
      previousLoansCount,
      completedLoansCount,
      overdueLoansCount,
      defaultedLoansCount,
      requestedLoanAmount,
    },
  };
}