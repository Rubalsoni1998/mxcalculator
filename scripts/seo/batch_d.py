import json, os, re, math, statistics
from datetime import date, timedelta
from fractions import Fraction
out={}
def D(d): return d.strftime('%B %-d, %Y')
lmp=date(2026,1,10); edd=lmp+timedelta(days=280)
ov=lmp+timedelta(days=30-14)
fw=(ov-timedelta(days=5), ov)
FAQ=lambda q,a:{'q':q,'a':a}
ACOG=[{'title':'ACOG: Patient resources on pregnancy','url':'https://www.acog.org/'}]

out['due-date-calculator']={'sections':f'''<h2>Worked Example: From the Last Period</h2>
<p>Doctors count pregnancy from the first day of the last menstrual period (LMP), and a full pregnancy is counted as 40 weeks, or 280 days. If your LMP was {D(lmp)}, your estimated due date is <strong>{D(edd)}</strong> (LMP + 280 days, often called Naegele's rule).</p>
<h2>Why Your Date Can Change</h2>
<ul><li>Naegele's rule assumes a 28-day cycle with ovulation on day 14. With longer or shorter cycles, the date shifts.</li><li>An early ultrasound measures the fetus and may move the date if it differs from the LMP date by more than a few days.</li><li>IVF pregnancies use the embryo transfer date, which is precise.</li></ul>
<h2>The Due Date Is an Estimate</h2>
<p>Only a small share of babies are born on the exact due date. ACOG describes 39 weeks to 40 weeks 6 days as full term, so a birth two weeks either side of the date is normal. Track your week-by-week progress with the <a href="pregnancy-calculator.html">pregnancy calculator</a>, and see the likely <a href="conception-calculator.html">conception window</a>.</p>''',
'extra_faqs':[FAQ('How accurate is a due date?','It is an estimate. Most births happen within a couple of weeks of the date. Your provider may adjust it after an early ultrasound.'),
 FAQ('What if my cycle is not 28 days?','Enter your actual cycle length if the calculator offers it. Longer cycles usually mean later ovulation and a later due date.'),
 FAQ('When is a baby considered full term?','ACOG defines full term as 39 weeks 0 days through 40 weeks 6 days.')],'sources':ACOG}

out['conception-calculator']={'sections':f'''<h2>Worked Example: A 30-Day Cycle</h2>
<p>Ovulation usually occurs about 14 days before the next period starts. With an LMP of {D(lmp)} and a 30-day cycle, ovulation falls around day 16, about <strong>{D(ov)}</strong>. The most likely conception window is the five days before ovulation through ovulation day, here <strong>{D(fw[0])} to {D(fw[1])}</strong>.</p>
<h2>Working Backward From a Due Date</h2>
<p>If you know the due date, subtract 266 days (38 weeks) to estimate conception, since pregnancy counted from LMP is about 14 days longer than the time since conception. This gives a single day, but the real window is wider because sperm can survive up to five days in the reproductive tract and the egg lives about 12 to 24 hours.</p>
<h2>Limits</h2>
<ul><li>The result is an estimate, especially with irregular cycles.</li><li>An early ultrasound is a more reliable way to date a pregnancy.</li><li>Calculating conception is not a way to establish paternity.</li></ul>
<p>To convert in the other direction use the <a href="pregnancy-conception-calculator.html">conception date to due date calculator</a>; track fertility with the <a href="ovulation-calculator.html">ovulation calculator</a>.</p>''',
'extra_faqs':[FAQ('How many days after my period do I conceive?','In a typical 28-day cycle, conception happens around day 14 to 16 counted from the first day of the last period. This varies with cycle length.'),
 FAQ('Can I conceive on any day of my cycle?','Pregnancy is only possible during the fertile window, roughly five days before ovulation through the day after. Cycles vary, so timing can shift.'),
 FAQ('How does an ultrasound date conception?','It measures the embryo or fetus and compares it with growth standards. In early pregnancy this is usually accurate to within a few days.')],'sources':ACOG}

out['pregnancy-conception-calculator']={'sections':f'''<h2>Worked Example: From a Conception Date</h2>
<p>If conception happened on {D(lmp+timedelta(days=14))}, the estimated due date is 266 days later: <strong>{D(lmp+timedelta(days=14+266))}</strong>. That is the same date as counting 280 days from an LMP of {D(lmp)} in a 28-day cycle.</p>
<h2>Gestational Age vs. Fetal Age</h2>
<p>Providers state pregnancy length as gestational age, counted from the LMP, so a pregnancy is already about two weeks along at conception. The baby's actual (fetal) age is about two weeks younger. This is why your doctor says "8 weeks" when conception was about 6 weeks ago.</p>
<h2>When Dates Do Not Match</h2>
<ul><li>If you know your conception date from IVF or ovulation tracking, it can be more accurate than the LMP.</li><li>Large differences between methods are usually settled by an ultrasound.</li></ul>
<p>Compare results with the <a href="due-date-calculator.html">due date calculator</a> and the <a href="pregnancy-calculator.html">pregnancy calculator</a>.</p>''',
'extra_faqs':[FAQ('How do I calculate a due date from conception?','Add 266 days (38 weeks) to the conception date.'),
 FAQ('Why is my pregnancy "two weeks" longer than the conception date suggests?','Gestational age starts at the last period, about two weeks before conception.'),
 FAQ('Is conception date the same as the day of intercourse?','Not always. Sperm can survive for days, so conception may occur several days after intercourse.')],'sources':ACOG}

out['ovulation-calculator']={'sections':f'''<h2>Worked Example</h2>
<p>With a 30-day cycle starting {D(lmp)}, ovulation is expected around day 16, on about <strong>{D(ov)}</strong>, and the fertile window runs from <strong>{D(fw[0])}</strong> to <strong>{D(fw[1])}</strong>. In a 28-day cycle, ovulation would come on day 14. Cycle length matters because ovulation is tied to the end of the cycle, not the start.</p>
<h2>Combining a Calculator With Body Signals</h2>
<ul><li>Cervical mucus often becomes clear and slippery before ovulation.</li><li>Ovulation predictor kits detect the LH surge, usually 24 to 36 hours before ovulation.</li><li>Basal body temperature rises slightly after ovulation, so it confirms it afterward rather than predicting it.</li></ul>
<h2>When Predictions Are Less Reliable</h2>
<p>Irregular cycles, recent hormonal contraception, breastfeeding, and conditions such as PCOS make calendar predictions less accurate. If you have been trying to conceive for 12 months (6 months if over 35), a clinician can help. See also the <a href="period-calculator.html">period calculator</a>.</p>''',
'extra_faqs':[FAQ('How long does ovulation last?','The egg survives about 12 to 24 hours after release, but sperm can live up to five days, which is why the fertile window is about six days.'),
 FAQ('Can I get pregnant right after my period?','It is less likely, but possible with short cycles because sperm can survive several days before ovulation.'),
 FAQ('Are ovulation calculators accurate?','They estimate from your average cycle. Tracking signs or using predictor kits improves accuracy.')],'sources':ACOG}

nxt=lambda n:[D(lmp+timedelta(days=28*i)) for i in range(1,n+1)]
out['period-calculator']={'sections':f'''<h2>Worked Example</h2>
<p>If your last period started {D(lmp)} and your cycle averages 28 days, the next periods are predicted for {', '.join(nxt(3))}. Cycle length is counted from the first day of one period to the first day of the next.</p>
<h2>What Counts as Normal</h2>
<p>ACOG describes cycles of 21 to 35 days in adults as normal, with bleeding that lasts around 2 to 7 days. Cycles can vary by a few days each month, which is why the calculator gives an estimate rather than a promise.</p>
<h2>Improving Predictions</h2>
<ul><li>Record start dates for several months and use your average.</li><li>Stress, travel, illness, weight change and hormonal methods can shift the date.</li><li>If you are late and could be pregnant, take a pregnancy test and see the <a href="pregnancy-calculator.html">pregnancy calculator</a>.</li></ul>
<p>Estimate your fertile days with the <a href="ovulation-calculator.html">ovulation calculator</a>.</p>''',
'extra_faqs':[FAQ('How many days is a normal menstrual cycle?','Adults commonly have cycles of 21 to 35 days. Teens may have slightly longer ones.'),
 FAQ('Why is my period late?','Common reasons are stress, illness, weight changes, hormonal changes or pregnancy. See a clinician if it happens often or you have other symptoms.'),
 FAQ('When should I see a doctor about my period?','Talk to a clinician if cycles are consistently shorter than 21 or longer than 35 days, bleeding is very heavy, or periods stop for 3 months or more.')],'sources':ACOG}

out['pregnancy-calculator']={'sections':f'''<h2>Worked Example: Where Are You Today?</h2>
<p>If your LMP was {D(lmp)}, you reach week 12 on <strong>{D(lmp+timedelta(weeks=12))}</strong>, the usual start of the second trimester is around week 13 ({D(lmp+timedelta(weeks=13))}), and the third trimester starts around week 28 ({D(lmp+timedelta(weeks=28))}). The due date is <strong>{D(edd)}</strong>.</p>
<h2>Trimesters at a Glance</h2>
<ul><li><strong>First trimester:</strong> weeks 1 to 12, when major organs form.</li><li><strong>Second trimester:</strong> weeks 13 to 27, often when movement is first felt.</li><li><strong>Third trimester:</strong> weeks 28 to birth.</li></ul>
<h2>Using the Dates</h2>
<p>Use these dates to plan prenatal visits and screening, which providers schedule by gestational week. Weight guidance is on the <a href="pregnancy-weight-gain-calculator.html">pregnancy weight gain calculator</a>, and dating details are on the <a href="due-date-calculator.html">due date calculator</a> page. This tool does not replace medical care.</p>''',
'extra_faqs':[FAQ('How many weeks is a full pregnancy?','Pregnancy is counted as about 40 weeks from the first day of the last period.'),
 FAQ('When does the second trimester start?','Usually around week 13, although some sources count from week 14.'),
 FAQ('How far along am I?','Count weeks from the first day of your last period, or from conception date plus two weeks. The calculator does this for you.')],'sources':ACOG}

out['pregnancy-weight-gain-calculator']={'sections':f'''<h2>Recommended Ranges</h2>
<p>The Institute of Medicine guidelines, which ACOG uses, set total gain by pre-pregnancy BMI for a single baby:</p>
<table><thead><tr><th>Pre-pregnancy BMI</th><th>Total gain</th><th>Weekly gain (2nd and 3rd trimesters)</th></tr></thead><tbody><tr><td>Under 18.5</td><td>28 to 40 lb</td><td>about 1 to 1.3 lb</td></tr><tr><td>18.5 to 24.9</td><td>25 to 35 lb</td><td>about 0.8 to 1 lb</td></tr><tr><td>25 to 29.9</td><td>15 to 25 lb</td><td>about 0.5 to 0.7 lb</td></tr><tr><td>30 or higher</td><td>11 to 20 lb</td><td>about 0.4 to 0.6 lb</td></tr></tbody></table>
<p>Total gain is about 1 to 4.5 lb in the first trimester for most people.</p>
<h2>Using the Numbers</h2>
<ul><li>Ranges are guidelines. Your provider may set a different goal for you.</li><li>Twin pregnancies have higher ranges; for normal-weight women the IOM range is 37 to 54 lb.</li><li>Eating for two does not mean double the calories; extra needs are modest and begin in the second trimester.</li></ul>
<p>Check your starting BMI with the <a href="bmi-calculator.html">BMI calculator</a>.</p>''',
'extra_faqs':[FAQ('How much weight should I gain in pregnancy?','It depends on pre-pregnancy BMI. For a normal-weight person with one baby, the guideline is 25 to 35 pounds.'),
 FAQ('Where does the weight go?','It includes the baby, placenta, amniotic fluid, larger breasts and uterus, extra blood and fluid, and fat stores.'),
 FAQ('What if I gain too much or too little?','Talk to your provider. They can look at your health, your baby\'s growth and your nutrition rather than relying on the number alone.')],'sources':ACOG}

# age
dob=date(1990,3,15); today=date(2026,11,23)
y=today.year-dob.year; mo=today.month-dob.month; dd=today.day-dob.day
if dd<0:
    mo-=1; prev=date(today.year,today.month,1)-timedelta(days=1); dd+=prev.day
if mo<0: y-=1; mo+=12
total=(today-dob).days
out['age-calculator']={'sections':f'''<h2>Worked Example</h2>
<p>Someone born on {D(dob)} is, on {D(today)}, <strong>{y} years, {mo} months and {dd} days</strong> old. That is {total:,} days in total. Age is counted as completed years, so you turn a year older on your birthday, not before.</p>
<h2>Leap Day Birthdays</h2>
<p>People born on February 29 have a birthday only in leap years. In non-leap years the legal birthday varies by state and context, often treated as February 28 or March 1.</p>
<h2>Uses and Related Tools</h2>
<ul><li>Add or subtract time with the <a href="date-calculator.html">date calculator</a>.</li><li>Many age-based rules, such as retirement benefits, use exact ages; check with the agency. See the <a href="retirement-calculator.html">retirement calculator</a>.</li></ul>''',
'extra_faqs':[FAQ('How do I calculate my age in days?','Subtract the birth date from today. The calculator counts every day, including leap days.'),
 FAQ('How old will I be on a future date?','Enter the future date in the comparison field to see your age on that day.'),
 FAQ('Is age counted differently in some countries?','Yes. Some countries use traditional systems that count a person as one at birth. The US counts completed years.')],'sources':[]}

# date
d1=date(2026,1,1); d2=date(2026,12,25)
out['date-calculator']={'sections':f'''<h2>Worked Examples</h2>
<div class="example"><p><strong>Days between dates.</strong> From January 1, 2026 to December 25, 2026 is <strong>{(d2-d1).days} days</strong> ({(d2-d1).days//7} weeks and {(d2-d1).days%7} days).</p></div>
<div class="example"><p><strong>Adding days.</strong> 90 days after {D(today)} is <strong>{D(today+timedelta(days=90))}</strong>.</p></div>
<h2>Counting Rules to Watch For</h2>
<ul><li>Whether the start date is counted. Contracts and deadlines often say "within 30 days after", which excludes the start day.</li><li>Month math: adding one month to January 31 gives the last day of February, since February is shorter.</li><li>Weekends and holidays are not skipped. For working days, subtract them separately.</li></ul>
<h2>Where It Helps</h2>
<p>Use it for countdowns, project deadlines, notice periods and due dates. For pregnancy specifically, see the <a href="due-date-calculator.html">due date calculator</a>; for hours and minutes, the <a href="time-calculator.html">time calculator</a>.</p>''',
'extra_faqs':[FAQ('How many days are there in a year?','365 days, or 366 in a leap year. A leap year occurs every four years except most century years not divisible by 400.'),
 FAQ('How do I count business days between two dates?','Take the total days, remove weekends, then subtract any holidays that fall on weekdays.'),
 FAQ('Does the calculator include the end date?','Check the result label. Counting both ends adds one day compared with simple subtraction.')],'sources':[]}

# hours
out['hours-calculator']={'sections':f'''<h2>Worked Example: A Shift With a Break</h2>
<p>A shift from 9:15 AM to 5:45 PM is 8 hours 30 minutes. Subtract a 30-minute unpaid break and you get <strong>8 hours</strong>. A shift from 8:00 AM to 4:50 PM with a 30-minute break is 8 hours 20 minutes, which is <strong>8.33 decimal hours</strong> (20 ÷ 60 = 0.33). Five such days add up to 41.67 hours.</p>
<h2>Converting Minutes to Decimals</h2>
<p>Payroll often uses decimals: 15 minutes = 0.25, 30 minutes = 0.50, 45 minutes = 0.75. Divide minutes by 60 for any other value.</p>
<h2>Overtime Basics</h2>
<p>Under the federal Fair Labor Standards Act, most hourly employees are owed at least 1.5 times their regular rate for hours over 40 in a workweek. Some states have stricter daily rules. Confirm your own rules with the Department of Labor or your state agency. Turn hours into pay with the <a href="salary-calculator.html">salary calculator</a>, and add or subtract clock times with the <a href="time-calculator.html">time calculator</a>.</p>''',
'extra_faqs':[FAQ('How do I calculate hours worked?','Subtract the start time from the end time, then subtract unpaid breaks. Convert minutes to decimals if you need payroll hours.'),
 FAQ('How do I convert 7 hours 45 minutes to decimal?','45 ÷ 60 = 0.75, so 7 hours 45 minutes is 7.75 hours.'),
 FAQ('When is overtime owed in the US?','Federal law requires overtime for covered, non-exempt employees after 40 hours in a workweek. Some states add daily limits.')],'sources':[]}

# gpa
pts=[(4.0,3),(3.3,4),(2.7,3),(3.7,2)]
gp=sum(a*b for a,b in pts)/sum(b for _,b in pts)
out['gpa-calculator']={'sections':f'''<h2>Worked Example</h2>
<p>Take four courses: an A (4.0) worth 3 credits, a B+ (3.3) worth 4, a B- (2.7) worth 3 and an A- (3.7) worth 2. Quality points are 12 + 13.2 + 8.1 + 7.4 = 40.7 over 12 credits, so the GPA is <strong>{gp:.2f}</strong>.</p>
<h2>Details That Change Your GPA</h2>
<ul><li>Schools use different scales: some give no plus or minus, and A+ may be 4.0 or 4.3.</li><li>Weighted GPAs give extra points for honors or AP courses; a weighted GPA can exceed 4.0.</li><li>Repeated courses may replace or average with the old grade depending on policy.</li></ul>
<h2>Planning Ahead</h2>
<p>To raise a cumulative GPA, the effect of a new semester depends on how many credits you already have. Check the grade you need with the <a href="grade-calculator.html">grade calculator</a>. For scholarship or graduation thresholds, confirm the rules with your school or <a href="https://studentaid.gov/" rel="noopener" target="_blank">Federal Student Aid</a>.</p>''',
'extra_faqs':[FAQ('How do I calculate GPA?','Multiply each grade point by the course credits, add those up, and divide by total credits.'),
 FAQ('What is a good GPA?','It depends on the school and goals. Many scholarships and programs use thresholds such as 3.0 or 3.5; check each one.'),
 FAQ('What is the difference between weighted and unweighted GPA?','Unweighted GPA ignores course difficulty and tops out at 4.0. Weighted GPA adds extra points for advanced courses.')],'sources':[{'title':'Federal Student Aid','url':'https://studentaid.gov/'}]}
out['gpa-calculator']['sections']=out['gpa-calculator']['sections'].replace(' or <a href="https://studentaid.gov/" rel="noopener" target="_blank">Federal Student Aid</a>','')

# grade
cur=.2*92+.3*78; need=(85-cur)/.5
out['grade-calculator']={'sections':f'''<h2>Worked Example: What Do I Need on the Final?</h2>
<p>Suppose homework is 20% of your grade (you have 92), the midterm is 30% (you scored 78) and the final is worth 50%. Your points so far are 0.20 × 92 + 0.30 × 78 = {cur:.1f}. To finish with an 85, you need a final score of (85 − {cur:.1f}) ÷ 0.50 = <strong>{need:.1f}%</strong>.</p>
<h2>Checks Before You Rely on It</h2>
<ul><li>Make sure the weights add up to 100%.</li><li>Confirm whether your instructor drops the lowest score or rounds up.</li><li>If the needed score is above 100, the target is not reachable without extra credit.</li></ul>
<h2>Next Step</h2>
<p>Convert grades into a GPA with the <a href="gpa-calculator.html">GPA calculator</a>; for percentages, the <a href="percent-calculator.html">percentage calculator</a> is handy.</p>''',
'extra_faqs':[FAQ('How do I calculate a weighted grade?','Multiply each category score by its weight, then add them. Weights should total 100%.'),
 FAQ('What grade do I need on the final to get an A?','Enter your current grade, the final\'s weight and the grade you want; the calculator solves for the score needed.'),
 FAQ('Can I still pass if I failed the midterm?','Possibly, depending on the weights. Enter your scores to see what the remaining work must be.')],'sources':[]}

# fraction
a=Fraction(3,4)+Fraction(5,6); b=Fraction(2,3)/Fraction(4,9)
out['fraction-calculator']={'sections':f'''<h2>Worked Examples</h2>
<div class="example"><p><strong>Adding.</strong> 3/4 + 5/6: use the common denominator 12. 9/12 + 10/12 = 19/12 = <strong>1 7/12</strong>.</p></div>
<div class="example"><p><strong>Dividing.</strong> 2/3 ÷ 4/9 = 2/3 × 9/4 = 18/12 = <strong>{b}</strong> (simplified).</p></div>
<div class="example"><p><strong>To a decimal.</strong> 7/8 = <strong>{7/8}</strong>.</p></div>
<h2>Simplifying</h2>
<p>Divide the numerator and denominator by their greatest common divisor. For 18/12 the GCD is 6, which gives 3/2. A fraction is fully simplified when the two numbers share no common factor other than 1.</p>
<h2>Mixed Numbers</h2>
<p>Convert a mixed number to an improper fraction before multiplying or dividing: 2 1/2 = 5/2. See the <a href="percent-calculator.html">percentage calculator</a> for percents and the <a href="scientific-calculator.html">scientific calculator</a> for more.</p>''',
'extra_faqs':[FAQ('How do I add fractions with different denominators?','Find a common denominator, convert each fraction, add the numerators, then simplify.'),
 FAQ('How do I divide fractions?','Multiply by the reciprocal of the second fraction: a/b ÷ c/d = a/b × d/c.'),
 FAQ('How do I turn a fraction into a percent?','Divide the numerator by the denominator and multiply by 100. For example, 3/4 = 0.75 = 75%.')],'sources':[]}

# scientific
out['scientific-calculator']={'sections':f'''<h2>Common Gotchas</h2>
<ul><li><strong>Degrees vs. radians.</strong> sin(30°) = <strong>0.5</strong>, but sin(30 radians) = <strong>{math.sin(30):.4f}</strong>. Check the mode before using trig functions.</li><li><strong>Order of operations.</strong> 2 + 3 × 4 = 14, not 20. Use parentheses to group, for example (2 + 3) × 4 = 20.</li><li><strong>log vs. ln.</strong> log is base 10 and ln is base e. log(1000) = 3, ln(e) = 1.</li></ul>
<h2>Quick Reference</h2>
<table><thead><tr><th>Expression</th><th>Result</th></tr></thead><tbody><tr><td>2^10</td><td>{2**10:,}</td></tr><tr><td>10!</td><td>{math.factorial(10):,}</td></tr><tr><td>√144</td><td>12</td></tr><tr><td>π (3.14159…)</td><td>{math.pi:.5f}</td></tr></tbody></table>
<h2>Related Tools</h2>
<p>For fractions use the <a href="fraction-calculator.html">fraction calculator</a>, for right triangles the <a href="triangle-calculator.html">triangle calculator</a>, and for statistics the <a href="standard-deviation-calculator.html">standard deviation calculator</a>.</p>''',
'extra_faqs':[FAQ('What does the factorial button do?','n! multiplies all whole numbers from 1 to n. For example, 5! = 120.'),
 FAQ('How do I calculate a square root?','Use the √ key, or raise the number to the power 0.5.'),
 FAQ('Why does my trig result look wrong?','The calculator may be in radians when you expect degrees. Switch the mode and try again.')],'sources':[]}

# standard deviation
data=[4,8,6,5,3]
sd=statistics.stdev(data); pdv=statistics.pstdev(data); mean=statistics.mean(data)
out['standard-deviation-calculator']={'sections':f'''<h2>Worked Example: Data 4, 8, 6, 5, 3</h2>
<p>The mean is {mean:g}. Squared deviations from the mean are {', '.join(f'{(x-mean)**2:g}' for x in data)}, which add up to {sum((x-mean)**2 for x in data):g}. For a <strong>sample</strong>, divide by n − 1 = 4 to get a variance of {statistics.variance(data):g} and a standard deviation of <strong>{sd:.3f}</strong>. For a whole <strong>population</strong>, divide by n = 5, giving a variance of {statistics.pvariance(data):g} and a standard deviation of <strong>{pdv:.3f}</strong>.</p>
<h2>Sample or Population?</h2>
<p>Use the population formula only when your data includes every member of the group you care about. When data is a subset, use the sample formula, which divides by n − 1 to avoid underestimating the spread.</p>
<h2>Interpreting the Result</h2>
<ul><li>A small standard deviation means values cluster near the mean.</li><li>In a roughly bell-shaped distribution, about 68% of values fall within one standard deviation of the mean and 95% within two.</li><li>Outliers pull the standard deviation up quickly.</li></ul>
<p>Use the <a href="percent-calculator.html">percentage calculator</a> or <a href="grade-calculator.html">grade calculator</a> for related work.</p>''',
'extra_faqs':[FAQ('What is the difference between variance and standard deviation?','Standard deviation is the square root of variance, which puts the spread back into the original units of the data.'),
 FAQ('Why divide by n − 1?','Dividing by n − 1 (Bessel\'s correction) corrects the bias when estimating population spread from a sample.'),
 FAQ('Can standard deviation be negative?','No. It is a square root, so it is zero or positive.')],'sources':[]}

# triangle
c=math.sqrt(7**2+9**2-2*7*9*math.cos(math.radians(60)))
s=(5+6+7)/2; area=math.sqrt(s*(s-5)*(s-6)*(s-7))
out['triangle-calculator']={'sections':f'''<h2>Worked Examples</h2>
<div class="example"><p><strong>Law of cosines.</strong> Two sides of 7 and 9 with a 60° angle between them: c² = 7² + 9² − 2 × 7 × 9 × cos 60° = 67, so the third side is <strong>{c:.3f}</strong>.</p></div>
<div class="example"><p><strong>Heron's formula.</strong> For sides 5, 6 and 7, s = 9 and the area is √(9 × 4 × 3 × 2) = <strong>{area:.2f}</strong> square units.</p></div>
<div class="example"><p><strong>Right triangle.</strong> Legs of 3 and 4 give a hypotenuse of 5, an area of 6, and a perimeter of 12.</p></div>
<h2>Which Rule to Use</h2>
<ul><li>Right triangle with two sides known: Pythagorean theorem.</li><li>Two angles and a side (AAS or ASA): law of sines.</li><li>Three sides (SSS) or two sides and the angle between them (SAS): law of cosines.</li><li>Two sides and a non-included angle (SSA) can have 0, 1 or 2 solutions.</li></ul>
<h2>Check Your Inputs</h2>
<p>The sum of any two sides must exceed the third, and angles must add to 180°. See the <a href="scientific-calculator.html">scientific calculator</a> for trig functions and the <a href="concrete-calculator.html">concrete calculator</a> for a practical use of area and volume.</p>''',
'extra_faqs':[FAQ('How do I find the area of a triangle with three sides?','Use Heron\'s formula: with s = (a + b + c) ÷ 2, area = √(s(s − a)(s − b)(s − c)).'),
 FAQ('What is the Pythagorean theorem?','In a right triangle, a² + b² = c², where c is the hypotenuse.'),
 FAQ('Why does my triangle have no solution?','The inputs may violate the triangle inequality or the angle sum, so no triangle can match them.')],'sources':[]}

# conversion
out['conversion-calculator']={'sections':f'''<h2>Handy Exact Conversions</h2>
<table><thead><tr><th>Unit</th><th>Equals</th></tr></thead><tbody><tr><td>1 inch</td><td>2.54 cm (exact)</td></tr><tr><td>1 mile</td><td>1.609344 km (exact)</td></tr><tr><td>1 pound</td><td>0.45359237 kg (exact)</td></tr><tr><td>1 US gallon</td><td>3.785411784 L (exact)</td></tr></tbody></table>
<h2>Temperature</h2>
<p>°F = °C × 9/5 + 32. So 22.2°C = 72°F, and 0°C = 32°F. To go the other way, °C = (°F − 32) × 5/9: 72°F = {(72-32)*5/9:.1f}°C.</p>
<h2>Watch for US vs. Imperial Units</h2>
<ul><li>The US gallon (3.785 L) is smaller than the imperial gallon (4.546 L).</li><li>US fluid ounces differ slightly from imperial ones.</li><li>The "ton" can mean short ton (2,000 lb, US), long ton or metric tonne.</li></ul>
<p>NIST publishes official conversion factors for the US. For measuring materials, see the <a href="concrete-calculator.html">concrete calculator</a>; for running speeds, the <a href="pace-calculator.html">pace calculator</a>.</p>''',
'extra_faqs':[FAQ('How many centimeters are in an inch?','Exactly 2.54 centimeters.'),
 FAQ('How do I convert pounds to kilograms?','Multiply pounds by 0.45359237. For example, 150 lb is about 68.04 kg.'),
 FAQ('Why are US and UK gallons different?','They come from different historical definitions: the US gallon is based on the old wine gallon, and the imperial gallon on the volume of 10 pounds of water.')],'sources':[{'title':'NIST: Weights and measures','url':'https://www.nist.gov/pml/owm'}]}

for slug,v in out.items():
    v['slug']=slug
    json.dump(v,open(os.path.join(os.path.dirname(__file__),'content',slug+'.json'),'w',encoding='utf8'),ensure_ascii=False,indent=1)
    print(slug,len(re.sub(r'<[^>]+>',' ',v['sections']).split()))
print(D(edd),D(ov),y,mo,dd,total,(d2-d1).days,D(today+timedelta(days=90)),round(gp,2),round(need,1),a,b,round(sd,3),round(pdv,3),round(c,3),round(area,2), D(lmp+timedelta(days=280)))
