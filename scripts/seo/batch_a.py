import json, os
def pmt(P, r, n): return P*r/(1-(1+r)**-n) if r else P/n
def rate_for(P, pay, n):
    lo, hi = 0.0, 1.0
    for _ in range(200):
        mid=(lo+hi)/2
        if pmt(P,mid/12,n) > pay: hi=mid
        else: lo=mid
    return mid*100
def m(x): return f'${x:,.0f}'
def m2(x): return f'${x:,.2f}'
out = {}

# mortgage
L=320000; p30=pmt(L,.065/12,360); t30=p30*360-L
p15=pmt(L,.0575/12,180); t15=p15*180-L
# extra $200/month on 30y 6.5%
bal=L; k=0; r=.065/12; ti=0
while bal>0.005:
    i=bal*r; ti+=i; bal=bal+i-(p30+200); k+=1
out['mortgage-calculator']={'sections':f'''<h2>Worked Example: $400,000 Home, 20% Down</h2>
<p>Say you buy a $400,000 home with 20% down. The loan is $320,000. At 6.5% for 30 years, principal and interest come to about <strong>{m2(p30)}</strong> a month, and you would pay roughly <strong>{m(t30)}</strong> in interest over the life of the loan. Property tax, homeowners insurance and any HOA dues come on top of that, which is why the calculator lets you add them.</p>
<div class="example"><p><strong>15 years instead of 30.</strong> Using an illustrative 5.75% rate (shorter terms usually price lower), the payment rises to about <strong>{m2(p15)}</strong>, but total interest falls to about <strong>{m(t15)}</strong>. You pay roughly {m(p15-p30)} more per month and save about {m(t30-t15)} in interest.</p></div>
<div class="example"><p><strong>Adding $200 a month.</strong> On the 30-year loan above, an extra $200 toward principal each month pays the loan off in about {k//12} years and {k%12} months and cuts interest by roughly {m(t30-ti)}.</p></div>
<p>The rates here are examples, not quotes. Use the rate on your own Loan Estimate.</p>
<h2>Using the Calculator for Real Decisions</h2>
<ul><li><strong>Compare loan offers on the same inputs.</strong> Change only the rate or term, so you see the true cost of each option.</li><li><strong>Test your budget with a rate cushion.</strong> Rerun the numbers 0.5 to 1 percentage point higher than today's rate to see whether the payment still fits.</li><li><strong>Include escrow items.</strong> Property tax and insurance vary a lot by state and county; see the <a href="property-tax-calculator.html">property tax calculator</a> for typical effective rates.</li><li><strong>Check PMI.</strong> With less than 20% down, use the <a href="pmi-calculator.html">PMI calculator</a> to see the added monthly cost and when it can end.</li></ul>
<h2>Costs Beyond the Monthly Payment</h2>
<p>The payment is only part of owning a home. Plan for closing costs (see the <a href="closing-cost-calculator.html">closing cost calculator</a>), maintenance, utilities and a cash reserve. Many buyers also underestimate how much the escrow portion can change from year to year when taxes or insurance are reassessed.</p>''',
'extra_faqs':[
 {'q':'How much is the monthly payment on a $300,000 mortgage?','a':f'At 6.5% for 30 years, principal and interest on $300,000 is about {m2(pmt(300000,.065/12,360))} a month, before taxes, insurance and PMI. At other rates or terms, enter your numbers in the calculator above.'},
 {'q':'Does the calculator include property tax and insurance?','a':'Yes. Enter annual property tax, home insurance, PMI and HOA fees to see an estimated total monthly payment, not just principal and interest.'},
 {'q':'Where can I find the real rate and costs for my loan?','a':'Lenders must give you a Loan Estimate within three business days of your application. It lists the rate, monthly payment and closing costs so you can compare offers side by side.'}],
'sources':[{'title':'CFPB: Buying a house','url':'https://www.consumerfinance.gov/owning-a-home/'}]}

# loan
p5=pmt(15000,.09/12,60); p3=pmt(15000,.09/12,36)
out['loan-calculator']={'sections':f'''<h2>Worked Example: A $15,000 Personal Loan</h2>
<p>Borrow $15,000 at 9% APR. Over 5 years the payment is about <strong>{m2(p5)}</strong> a month and total interest is about <strong>{m(p5*60-15000)}</strong>. Shorten the term to 3 years and the payment rises to about <strong>{m2(p3)}</strong>, but interest drops to about <strong>{m(p3*36-15000)}</strong>.</p>
<div class="example"><p>The shorter loan costs about {m(p3-p5)} more each month and saves about {m((p5*60-15000)-(p3*36-15000))} in interest. The right choice depends on what your monthly budget can safely carry.</p></div>
<h2>Comparing Loan Offers</h2>
<ul><li><strong>Look at APR, not just the interest rate.</strong> APR includes certain fees, so it is the better number for comparing lenders.</li><li><strong>Check for an origination fee.</strong> Some lenders deduct it from the amount you receive, so you repay more than you actually get.</li><li><strong>Ask about prepayment penalties.</strong> Most personal loans have none, but confirm before signing.</li><li><strong>Compare total cost.</strong> A lower payment on a longer term often means a higher total cost.</li></ul>
<h2>Before You Borrow</h2>
<p>Lenders mainly look at your credit history, income and existing debt. A lower debt-to-income ratio and a higher credit score usually mean a lower rate. If you are borrowing for a car or a home, the <a href="auto-loan-calculator.html">auto loan calculator</a> and <a href="mortgage-calculator.html">mortgage calculator</a> add the costs specific to those loans.</p>''',
'extra_faqs':[
 {'q':'How is the monthly loan payment calculated?','a':'It uses the amortization formula: payment = P × r ÷ (1 − (1 + r)^−n), where P is the amount borrowed, r is the monthly rate and n is the number of payments. Each payment covers that month\'s interest first, then reduces principal.'},
 {'q':'Is it better to take a shorter loan term?','a':'A shorter term costs less interest overall but raises the monthly payment. If the payment fits your budget comfortably, shorter is usually cheaper; if not, a longer term with extra payments when possible gives flexibility.'},
 {'q':'What is the difference between APR and interest rate?','a':'The interest rate is the cost of borrowing the principal. APR adds certain lender fees and expresses the total as a yearly rate, which makes offers easier to compare.'}],
'sources':[{'title':'CFPB: Consumer tools','url':'https://www.consumerfinance.gov/consumer-tools/auto-loans/'}]}

# payment
rows=''.join(f'<tr><td>{n} months</td><td>{m2(pmt(25000,.07/12,n))}</td><td>{m(pmt(25000,.07/12,n)*n-25000)}</td></tr>' for n in (36,48,60,72))
out['payment-calculator']={'sections':f'''<h2>How Term Length Changes the Payment</h2>
<p>For a $25,000 loan at 7% APR, here is how the monthly payment and total interest change with the term:</p>
<table><thead><tr><th>Term</th><th>Monthly payment</th><th>Total interest</th></tr></thead><tbody>{rows}</tbody></table>
<p>Stretching the term lowers the payment but increases total interest. That trade-off is the main thing the calculator helps you see.</p>
<h2>Checking the Result by Hand</h2>
<p>The monthly rate is the APR divided by 12. For 7% that is 0.5833%. Multiply it by the balance to get the first month's interest, which on $25,000 is about $145.83. Whatever remains of the payment reduces principal, so each month a little more goes to principal and a little less to interest.</p>
<h2>When a Payment Calculator Is Not Enough</h2>
<ul><li>Loans with variable rates change the payment when the rate resets.</li><li>Interest-only periods and balloon payments do not follow the standard formula.</li><li>For a full month-by-month breakdown, use the <a href="amortization-calculator.html">amortization calculator</a>.</li></ul>''',
'extra_faqs':[
 {'q':'How do I calculate a monthly payment without a calculator?','a':'Use payment = P × r ÷ (1 − (1 + r)^−n). Divide the annual rate by 12 for r, and use the number of months for n. A spreadsheet PMT function does the same thing.'},
 {'q':'Why does a longer loan cost more?','a':'Interest accrues on the remaining balance each month. A longer term keeps a larger balance outstanding for longer, so more interest builds up even though each payment is smaller.'},
 {'q':'Do extra payments lower my monthly payment?','a':'Usually they shorten the loan instead. Extra principal reduces the balance, so you owe less interest each month and finish earlier, unless the lender recasts the loan.'}],
'sources':[{'title':'CFPB: Consumer tools','url':'https://www.consumerfinance.gov/consumer-tools/auto-loans/'}]}

# interest-rate
r1=rate_for(20000,400,60); r2=rate_for(10000,300,36)
out['interest-rate-calculator']={'sections':f'''<h2>Worked Example: Finding the Rate You Are Really Paying</h2>
<p>Suppose you borrow $20,000 and the lender asks for $400 a month for 60 months. The implied annual rate is about <strong>{r1:.2f}%</strong>. A shorter case: $10,000 repaid at $300 a month for 36 months works out to about <strong>{r2:.2f}%</strong>.</p>
<div class="example"><p>There is no closed-form formula for the rate, so the calculator searches for the rate at which the payments exactly repay the loan. That is the same approach spreadsheets use in their RATE function.</p></div>
<h2>When This Is Useful</h2>
<ul><li><strong>Dealer financing.</strong> Dealers often quote only a payment. Enter the price, term and payment to see the actual rate.</li><li><strong>Buy-here-pay-here or store credit.</strong> Offers that advertise a low payment can hide a high rate.</li><li><strong>Checking a loan document.</strong> Confirm the stated APR matches the payments you are asked to make.</li></ul>
<h2>Limits of the Result</h2>
<p>Fees paid at closing, rolled-in costs and variable rates all change the effective cost. If the lender finances fees as part of the loan, enter the full amount financed. For an official figure, the lender's APR disclosure under the Truth in Lending Act is the number to compare. You can test different loans with the <a href="loan-calculator.html">loan calculator</a>.</p>''',
'extra_faqs':[
 {'q':'How do I find the interest rate on a loan?','a':'Enter the loan amount, the term and the monthly payment. The calculator solves for the annual rate that makes those payments repay the loan exactly.'},
 {'q':'Is the rate shown the same as the APR?','a':'It is the effective annual rate implied by the amount financed and the payments. If fees are included in the amount you enter, it behaves like an APR. Always compare with the lender\'s disclosed APR.'},
 {'q':'Why is my calculated rate higher than the quoted one?','a':'Fees, insurance or add-on products financed in the loan raise the payment, which raises the implied rate. Make sure the amount you enter matches what you actually receive.'}],
'sources':[{'title':'CFPB: Consumer tools','url':'https://www.consumerfinance.gov/consumer-tools/auto-loans/'}]}

# inflation
f20=1.03**20; 
out['inflation-calculator']={'sections':f'''<h2>Worked Example: 3% Inflation for 20 Years</h2>
<p>At a steady 3% a year, prices rise by a factor of 1.03<sup>20</sup> ≈ <strong>{f20:.2f}</strong>. Something that costs $1,000 today would cost about <strong>{m(1000*f20)}</strong> in 20 years. Put the other way, $1,000 of cash would then buy only about <strong>{m(1000/f20)}</strong> of today's goods.</p>
<div class="example"><p>The rule of 72 gives a quick check: divide 72 by the inflation rate to estimate the years it takes prices to double. At 3% that is about 24 years; at 4% it is about 18.</p></div>
<h2>Why Your Own Inflation Rate Differs</h2>
<p>The Consumer Price Index measures an average basket of goods. Your household may spend more on housing, health care, tuition or food than that average, so the inflation you feel can be higher or lower. Treat the calculator as a way to test scenarios, not to predict the future.</p>
<h2>Using Inflation in Planning</h2>
<ul><li>Judge a raise in real terms: a 3% raise during 3% inflation does not increase buying power.</li><li>Think about "real" returns: an investment earning 6% while inflation runs 3% grows buying power by about 3% a year. See the <a href="investment-calculator.html">investment calculator</a>.</li><li>Plan retirement spending in future dollars with the <a href="retirement-calculator.html">retirement calculator</a>.</li></ul>''',
'extra_faqs':[
 {'q':'Where do official US inflation numbers come from?','a':'The Bureau of Labor Statistics publishes the Consumer Price Index each month. Annual inflation is the percentage change in the CPI over 12 months.'},
 {'q':'What is the formula for inflation?','a':'Inflation rate = (new price level − old price level) ÷ old price level × 100. To project a future price, multiply today\'s price by (1 + rate) raised to the number of years.'},
 {'q':'Does inflation affect savings?','a':'Yes. If your savings earn less than the inflation rate, their buying power shrinks even though the dollar balance grows.'}],
'sources':[{'title':'BLS: Consumer Price Index','url':'https://www.bls.gov/cpi/'}]}

# investment
def fv(init, mo, rate, yrs):
    r=rate/12; n=yrs*12
    return init*(1+r)**n + mo*(((1+r)**n-1)/r)
vals={x:fv(10000,500,x/100,20) for x in (5,7,9)}
contrib=10000+500*240
real=fv(10000,500,((1.07/1.03)-1),20)
out['investment-calculator']={'sections':f'''<h2>Worked Example: $10,000 Plus $500 a Month</h2>
<p>Start with $10,000 and add $500 every month for 20 years, with returns compounded monthly. Total contributions are {m(contrib)}. The ending balance depends heavily on the return you assume:</p>
<table><thead><tr><th>Annual return</th><th>Ending balance</th><th>Growth beyond contributions</th></tr></thead><tbody>{''.join(f"<tr><td>{k}%</td><td>{m(v)}</td><td>{m(v-contrib)}</td></tr>" for k,v in vals.items())}</tbody></table>
<p>These are illustrations, not forecasts. Real returns vary from year to year and are never guaranteed.</p>
<h2>Adjusting for Inflation</h2>
<p>At a 7% nominal return and 3% inflation, the real return is about 3.9%, and the same plan is worth roughly <strong>{m(real)}</strong> in today's dollars. Use the inflation field in the calculator to see this directly, or read about the effect on the <a href="inflation-calculator.html">inflation calculator</a> page.</p>
<h2>What Moves the Result Most</h2>
<ul><li><strong>Time.</strong> Starting earlier does more than saving more later, because growth compounds on earlier growth.</li><li><strong>Contributions.</strong> Regular deposits are the part you control.</li><li><strong>Fees.</strong> A fund charging 1% a year takes a meaningful share of long-term growth.</li><li><strong>Taxes.</strong> Taxable accounts, 401(k)s and IRAs are taxed differently. See the <a href="capital-gains-tax-calculator.html">capital gains tax calculator</a> for taxable accounts.</li></ul>''',
'extra_faqs':[
 {'q':'How much will $500 a month grow to?','a':f'With monthly compounding at 7% for 20 years and no starting balance, $500 a month grows to about {m(fv(0,500,.07,20))}. Change the return, years and starting amount in the calculator to see your own figure.'},
 {'q':'What return should I assume?','a':'Use a range rather than one number, for example 4%, 6% and 8%. Long-term returns depend on what you hold, and past results do not guarantee future ones.'},
 {'q':'Is the result before or after tax?','a':'It is before tax unless you account for it. Taxes depend on the account type and your bracket, so treat the result as a pre-tax estimate.'}],
'sources':[{'title':'Investor.gov: Compound interest calculator','url':'https://www.investor.gov/financial-tools-calculators/calculators/compound-interest-calculator'}]}

# interest
s=5000*.04*10; c1=5000*1.04**10; c12=5000*(1+.04/12)**120
out['interest-calculator']={'sections':f'''<h2>Simple vs. Compound: $5,000 at 4% for 10 Years</h2>
<table><thead><tr><th>Method</th><th>Ending amount</th><th>Interest earned</th></tr></thead><tbody><tr><td>Simple interest</td><td>{m2(5000+s)}</td><td>{m2(s)}</td></tr><tr><td>Compounded yearly</td><td>{m2(c1)}</td><td>{m2(c1-5000)}</td></tr><tr><td>Compounded monthly</td><td>{m2(c12)}</td><td>{m2(c12-5000)}</td></tr></tbody></table>
<p>Simple interest is earned only on the original amount. Compound interest is earned on the amount plus interest already added, so the gap widens the longer the money stays put.</p>
<h2>Which One Applies to You?</h2>
<ul><li><strong>Savings accounts, CDs and money market accounts</strong> usually compound daily or monthly.</li><li><strong>Credit cards</strong> typically compound daily on unpaid balances.</li><li><strong>Auto loans and many personal loans</strong> accrue interest on the remaining balance, which behaves like simple interest on each month's balance.</li><li><strong>Some short-term notes and bonds</strong> use simple interest.</li></ul>
<h2>APR vs. APY</h2>
<p>APR is the stated yearly rate. APY includes the effect of compounding, so it is higher than APR when interest compounds more than once a year. When comparing savings accounts, compare APY. For regular deposits, use the <a href="compound-interest-calculator.html">compound interest calculator</a>.</p>''',
'extra_faqs':[
 {'q':'What is the formula for simple interest?','a':'Interest = principal × rate × time. For $5,000 at 4% for 10 years, that is 5,000 × 0.04 × 10 = $2,000.'},
 {'q':'What is the formula for compound interest?','a':'A = P × (1 + r/n)^(n×t), where P is the principal, r the annual rate, n the compounding periods per year and t the years.'},
 {'q':'How often should interest compound for the best return?','a':'More frequent compounding earns slightly more, but the difference between daily and monthly is small. The rate and the time matter far more.'}],
'sources':[{'title':'Investor.gov: Compound interest calculator','url':'https://www.investor.gov/financial-tools-calculators/calculators/compound-interest-calculator'}]}

# finance
fvd=fv(0,200,.06,10); pv50=50000/(1.05**8)
out['finance-calculator']={'sections':f'''<h2>Worked Examples</h2>
<div class="example"><p><strong>Future value.</strong> Saving $200 a month for 10 years at 6% compounded monthly builds to about <strong>{m(fvd)}</strong>, of which $24,000 is your own deposits.</p></div>
<div class="example"><p><strong>Present value.</strong> To have $50,000 in 8 years with a 5% annual return and no deposits, you would need about <strong>{m(pv50)}</strong> today.</p></div>
<div class="example"><p><strong>Payment.</strong> To repay $25,000 at 7% over 60 months, the payment is about <strong>{m2(pmt(25000,.07/12,60))}</strong> a month.</p></div>
<h2>Sign Conventions</h2>
<p>Time value of money problems track the direction of cash. Money you receive is positive and money you pay out is negative. If the result looks like it has the wrong sign, check whether the present value and the payment point the same way.</p>
<h2>Choosing What to Solve For</h2>
<ul><li>Solve for <strong>payment</strong> when planning loans or savings targets.</li><li>Solve for <strong>rate</strong> to check what return or interest cost a deal implies.</li><li>Solve for <strong>periods</strong> to see how long a goal will take.</li></ul>
<p>For specific cases, the <a href="loan-calculator.html">loan calculator</a> and <a href="investment-calculator.html">investment calculator</a> are simpler.</p>''',
'extra_faqs':[
 {'q':'What does TVM mean?','a':'TVM stands for time value of money: a dollar today is worth more than a dollar later because it can earn a return. The five linked values are present value, future value, payment, rate and number of periods.'},
 {'q':'What is the difference between present value and future value?','a':'Present value is what a future amount is worth today. Future value is what a present amount will grow to after earning a return for a set time.'},
 {'q':'Why is the payment negative?','a':'Finance calculators use cash-flow signs. A payment you make is an outflow and shows as negative, while a loan you receive is an inflow.'}],
'sources':[{'title':'Investor.gov: Compound interest calculator','url':'https://www.investor.gov/financial-tools-calculators/calculators/compound-interest-calculator'}]}

for slug,v in out.items():
    v['slug']=slug
    json.dump(v,open(os.path.join(os.path.dirname(__file__),'content',slug+'.json'),'w',encoding='utf8'),ensure_ascii=False,indent=1)
    import re; print(slug, len(re.sub(r'<[^>]+>',' ',v['sections']).split()))
print(round(p30,2),round(t30),round(p15,2),k,round(r1,2),round(r2,2),round(f20,3),[round(x) for x in vals.values()],round(real),round(fvd),round(pv50))
