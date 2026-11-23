import json, os, re, math
L=math.log10
out={}
# army / navy-style tape male
bf=86.010*L(34-15.5)-70.041*L(70)+36.76
bf2=86.010*L(32-15.5)-70.041*L(70)+36.76
out['army-body-fat-calculator']={'sections':f'''<h2>Worked Example: Male, 70 in Tall</h2>
<p>Take a man who is 70 inches tall with a 15.5 in neck and a 34 in waist (measured at the navel). The tape formula, 86.010 × log10(waist − neck) − 70.041 × log10(height) + 36.76, gives about <strong>{bf:.1f}%</strong> body fat. If the waist were 32 in, the result would be about <strong>{bf2:.1f}%</strong>, so a two-inch change in the waist moves the estimate by roughly {bf-bf2:.1f} points.</p>
<h2>Measuring Correctly</h2>
<ul><li>Measure the neck just below the larynx, with the tape sloping slightly downward.</li><li>Measure the waist at the navel for men; women's formulas also use hip circumference.</li><li>Keep the tape snug but not compressing the skin, and exhale normally.</li><li>Take each measurement three times and use the average.</li></ul>
<h2>What the Result Means</h2>
<p>The tape test is a screening estimate and can differ from DEXA or other direct methods by several percentage points. Official standards depend on age and sex and are set by the branch of service, so check the current regulation rather than relying on a general calculator. For a civilian view, see the <a href="body-fat-calculator.html">body fat calculator</a>.</p>''',
'extra_faqs':[{'q':'Is the Army tape test accurate?','a':'It is a quick estimate. Accuracy depends on measuring technique and can differ from direct methods by several percentage points.'},
 {'q':'What measurements do women need for the tape test?','a':'Women are measured at the neck, waist and hips, in addition to height. Always confirm the current method in the official regulation.'},
 {'q':'Can muscle affect the tape result?','a':'The formula only uses circumferences, so a thick neck and a thin waist lower the estimate, while a larger waist raises it regardless of muscle.'}],
'sources':[{'title':'NHLBI: Healthy weight resources','url':'https://www.nhlbi.nih.gov/'}]}

# target heart rate
mx=220-40
out['target-heart-rate-calculator']={'sections':f'''<h2>Worked Example: Age 40</h2>
<p>Using the common formula 220 − age, a 40-year-old has an estimated maximum heart rate of <strong>{mx} beats per minute</strong>. A moderate-intensity zone of 50 to 70 percent is about <strong>{mx*.5:.0f} to {mx*.7:.0f} bpm</strong>, and a vigorous zone of 70 to 85 percent is about <strong>{mx*.7:.0f} to {mx*.85:.0f} bpm</strong>.</p>
<div class="example"><p><strong>Karvonen method.</strong> With a resting heart rate of 60, the heart rate reserve is {mx}−60 = {mx-60}. At 60% intensity the target is 60 + 0.60 × {mx-60} = <strong>{60+.6*(mx-60):.0f} bpm</strong>; at 80% it is <strong>{60+.8*(mx-60):.0f} bpm</strong>.</p></div>
<h2>Limits of the Formulas</h2>
<p>Maximum heart rate varies from person to person by many beats per minute, so age-based formulas are rough. Medications such as beta-blockers lower heart rate and make these zones unreliable. If you have a heart condition, check zones with your doctor.</p>
<h2>Using Zones</h2>
<ul><li>Use the talk test: during moderate effort you can talk but not sing.</li><li>Check pace targets with the <a href="pace-calculator.html">pace calculator</a>.</li><li>Estimate workout energy with the <a href="calories-burned-calculator.html">calories burned calculator</a>.</li></ul>''',
'extra_faqs':[{'q':'What is a good target heart rate for fat burning?','a':'There is no special fat-burning zone. Moderate effort, roughly 50 to 70 percent of maximum, is sustainable for longer sessions. Total energy use over time matters most.'},
 {'q':'Is 220 minus age accurate?','a':'It is an estimate with a wide margin of error for individuals. A supervised test gives a better measurement.'},
 {'q':'What is a normal resting heart rate?','a':'Adults commonly have a resting rate of 60 to 100 beats per minute, and well-trained people are often lower. Talk to a clinician about readings outside your usual range.'}],
'sources':[{'title':'American Heart Association: Target heart rates','url':'https://www.heart.org/en/healthy-living/fitness/fitness-basics/target-heart-rates'}]}

# 1RM
ep=200*(1+5/30); br=200*36/(37-5)
out['one-rep-max-calculator']={'sections':f'''<h2>Worked Example: 200 lb for 5 Reps</h2>
<p>If you lift 200 lb for 5 clean reps, the Epley formula (weight × (1 + reps ÷ 30)) gives an estimated one rep max of <strong>{ep:.0f} lb</strong>. The Brzycki formula (weight × 36 ÷ (37 − reps)) gives <strong>{br:.0f} lb</strong>. Estimates differ by a few percent, and all are most reliable at 10 reps or fewer.</p>
<h2>Turning 1RM Into a Training Plan</h2>
<table><thead><tr><th>% of 1RM</th><th>Weight (using {ep:.0f} lb)</th><th>Typical use</th></tr></thead><tbody>{''.join(f"<tr><td>{p}%</td><td>{ep*p/100:.0f} lb</td><td>{u}</td></tr>" for p,u in ((85,'Heavy sets, strength'),(75,'Moderate sets, 8-10 reps'),(65,'Higher reps, endurance')))}</tbody></table>
<h2>Safety</h2>
<ul><li>Estimating is safer than testing a true one-rep max, especially without a spotter.</li><li>Use sets you completed with good form; a grinding last rep skews the estimate.</li><li>Recalculate every few weeks as you get stronger.</li></ul>
<p>Pair training with enough protein; see the <a href="protein-calculator.html">protein calculator</a>.</p>''',
'extra_faqs':[{'q':'Which one rep max formula is the most accurate?','a':'No single formula is best for everyone. Epley and Brzycki are widely used and close to each other at low reps. Use the same formula consistently to track progress.'},
 {'q':'Is it safe to test a true 1RM?','a':'It carries more risk than submaximal sets. Use a spotter or safety bars and warm up thoroughly, or estimate from a lighter set instead.'},
 {'q':'Can beginners use a 1RM calculator?','a':'Yes, but form should come first. Estimates are less stable when technique is still changing.'}],
'sources':[]}

# pace
def mmss(mins): 
    s=round(mins*60); return f'{s//60}:{s%60:02d}'
p5k=25/3.1068559611866697
p10=6.2137119223733395*8.5
pm=240/26.21875
out['pace-calculator']={'sections':f'''<h2>Worked Examples</h2>
<div class="example"><p><strong>5K goal.</strong> A 25:00 5K means running about <strong>{mmss(p5k)} per mile</strong> (5 km is 3.107 miles).</p></div>
<div class="example"><p><strong>10K at 8:30 per mile.</strong> A 10K is 6.214 miles, so the finish time is about <strong>{p10//1:.0f} min {round((p10%1)*60)} sec</strong>, or {mmss(p10)} (min:sec).</p></div>
<div class="example"><p><strong>Marathon in 4 hours.</strong> The marathon is 26.2 miles, so you need about <strong>{mmss(pm)} per mile</strong>.</p></div>
<h2>Pacing Tips</h2>
<ul><li>Run the first mile slightly slower than goal pace; going out too fast is the most common mistake.</li><li>For races longer than a 10K, steady effort beats alternating fast and slow miles.</li><li>Hills and heat slow pace; adjust expectations on tough courses.</li></ul>
<p>Check effort with <a href="target-heart-rate-calculator.html">heart rate zones</a>, and use the <a href="conversion-calculator.html">unit converter</a> for miles and kilometers.</p>''',
'extra_faqs':[{'q':'How do I convert pace per mile to pace per kilometer?','a':'Divide minutes per mile by 1.609. For example, 8:00 per mile is about 4:58 per kilometer.'},
 {'q':'What is a good 5K time?','a':'It depends on age, experience and goals. Finishing comfortably is a good first target; use the calculator to set a realistic pace.'},
 {'q':'How many miles is a half marathon?','a':'A half marathon is 13.1 miles, or 21.1 kilometers.'}],
'sources':[]}

# BAC using tool formula: male 180 lb 4 drinks 2h
kg=180*0.45359237; g=4*14
b=g/(kg*1000*0.68)*100-0.015*2
out['bac-calculator']={'sections':f'''<h2>Worked Example: Four Drinks in Two Hours</h2>
<p>A 180 lb man who has four standard drinks (about 14 grams of alcohol each) over two hours has an estimated BAC of about <strong>{b:.3f}%</strong> using the Widmark formula with a 0.68 factor and 0.015% elimination per hour. That is already above the 0.08% limit that applies for driving in most US states.</p>
<h2>Why Estimates Can Be Wrong</h2>
<ul><li>Food, medications, health conditions, body fat and drinking pace all change real BAC.</li><li>Women typically reach a higher BAC than men of the same weight for the same drinks, which the calculator reflects with a different factor.</li><li>Drink size varies. A large pour or a strong craft beer can count as more than one standard drink.</li></ul>
<h2>Safety</h2>
<p>Impairment begins well before 0.08%. The only safe approach to driving is not to drink beforehand; plan a ride instead. Coffee, showers and food do not lower BAC faster. If someone cannot be woken or is breathing slowly, call 911.</p>''',
'extra_faqs':[{'q':'How long does it take to sober up?','a':'The body clears roughly 0.015% BAC per hour on average, but this varies. Only time lowers BAC.'},
 {'q':'What counts as one standard drink?','a':'In the US it is about 14 grams of pure alcohol: 12 oz of regular beer, 5 oz of wine or 1.5 oz of 80-proof spirits.'},
 {'q':'Can I use this to decide if I can drive?','a':'No. It is an estimate and impairment can occur at lower levels. Do not drive after drinking.'}],
'sources':[{'title':'NHTSA: Drunk driving','url':'https://www.nhtsa.gov/risky-driving/drunk-driving'}]}

# GFR 2021 CKD-EPI male 50 scr 1.0 ; female 50 scr 1.0
def egfr(scr,age,female):
    k=.7 if female else .9; a=-.241 if female else -.302; r=scr/k
    return 142*min(r,1)**a*max(r,1)**-1.2*.9938**age*(1.012 if female else 1)
e1=egfr(1.0,50,False); e2=egfr(1.0,50,True); e3=egfr(1.6,50,False)
out['gfr-calculator']={'sections':f'''<h2>Worked Examples (CKD-EPI 2021)</h2>
<p>For a 50-year-old with a serum creatinine of 1.0 mg/dL, the equation gives an eGFR of about <strong>{e1:.0f} mL/min/1.73 m²</strong> for a man and about <strong>{e2:.0f}</strong> for a woman. If creatinine were 1.6 mg/dL, a 50-year-old man would have an eGFR of about <strong>{e3:.0f}</strong>. The same creatinine means different eGFR values because muscle mass differs on average between sexes and across ages.</p>
<h2>Reading the Result</h2>
<p>Kidney function normally declines slowly with age. A single low eGFR does not by itself mean chronic kidney disease: doctors look for values that stay low for at least three months, along with urine tests for protein. Dehydration, medications, a very high-protein meal or intense exercise can temporarily change creatinine.</p>
<h2>When eGFR May Mislead</h2>
<ul><li>Very high or low muscle mass changes creatinine independent of kidney function.</li><li>Some conditions and drugs change creatinine without affecting the kidneys.</li><li>Pregnancy and acute illness need clinical interpretation.</li></ul>
<p>This tool does not diagnose anything. Discuss results with your clinician. Related sizing: <a href="body-surface-area-calculator.html">body surface area</a>.</p>''',
'extra_faqs':[{'q':'What is a normal GFR?','a':'A GFR of 90 or above is generally considered normal, though it declines with age. Your clinician interprets it with other tests.'},
 {'q':'What is the difference between GFR and eGFR?','a':'GFR is the true filtration rate, which is hard to measure. eGFR is an estimate calculated from serum creatinine, age and sex.'},
 {'q':'Does the equation use race?','a':'The 2021 CKD-EPI creatinine equation removed the race variable. This calculator uses age, sex and creatinine only.'}],
'sources':[{'title':'NIDDK: Kidney disease','url':'https://www.niddk.nih.gov/'}]}

# body type WHR
out['body-type-calculator']={'sections':f'''<h2>Worked Example: Waist-to-Hip Ratio</h2>
<p>Waist-to-hip ratio is waist circumference divided by hip circumference. A 32-inch waist with 40-inch hips gives <strong>{32/40:.2f}</strong>. A 38-inch waist with 40-inch hips gives <strong>{38/40:.2f}</strong>. The World Health Organization lists a ratio of 0.90 or higher for men and 0.85 or higher for women as a marker of abdominal obesity.</p>
<h2>How to Measure</h2>
<ul><li>Measure waist at the narrowest point, or at the midpoint between the lowest rib and the top of the hip bone.</li><li>Measure hips at the widest part of the buttocks.</li><li>Stand relaxed, with the tape level and snug.</li></ul>
<h2>What Body Shape Tells You</h2>
<p>Shape labels like "apple" or "pear" describe where weight tends to be carried. They are not diagnoses. Fat around the abdomen is linked with higher health risk than fat on the hips and thighs, which is why waist measures are useful alongside BMI. See the <a href="bmi-calculator.html">BMI calculator</a> and <a href="body-fat-calculator.html">body fat calculator</a>.</p>''',
'extra_faqs':[{'q':'What is a healthy waist-to-hip ratio?','a':'The WHO cites below 0.90 for men and below 0.85 for women as lower-risk. Individual risk depends on other factors too.'},
 {'q':'Can I change my body shape?','a':'Genetics largely set where fat is stored, but overall fat loss and strength training can change measurements.'},
 {'q':'Is WHR better than BMI?','a':'They measure different things. WHR reflects fat distribution, while BMI compares weight with height. Using both gives a fuller picture.'}],
'sources':[{'title':'NIDDK: Health information','url':'https://www.niddk.nih.gov/'}]}

for slug,v in out.items():
    v['slug']=slug
    json.dump(v,open(os.path.join(os.path.dirname(__file__),'content',slug+'.json'),'w',encoding='utf8'),ensure_ascii=False,indent=1)
    print(slug,len(re.sub(r'<[^>]+>',' ',v['sections']).split()))
print(round(bf,1),round(bf2,1),round(ep),round(br),mmss(p5k),mmss(p10),mmss(pm),round(b,3),round(e1),round(e2),round(e3))
