import json, os, re, math
def m(x): return f'{x:,.0f}'
out={}
kg=lambda lb: lb*0.45359237
cm=lambda i: i*2.54
def mifflin(sex,lb,inch,age):
    return 10*kg(lb)+6.25*cm(inch)-5*age+(5 if sex=='m' else -161)
# TDEE: woman 35, 5'6", 150 lb
bmr=mifflin('f',150,66,35)
acts=[('Sedentary (little exercise)',1.2),('Lightly active (1-3 days/week)',1.375),('Moderately active (3-5 days/week)',1.55),('Very active (6-7 days/week)',1.725)]
rows=''.join(f'<tr><td>{n}</td><td>{x}</td><td>{m(bmr*x)}</td></tr>' for n,x in acts)
out['tdee-calculator']={'sections':f'''<h2>Worked Example: 35-Year-Old Woman, 5'6", 150 lb</h2>
<p>Using the Mifflin-St Jeor equation, her basal metabolic rate is about <strong>{m(bmr)} calories</strong> a day. Multiplying by a common activity factor gives her total daily energy expenditure (TDEE):</p>
<table><thead><tr><th>Activity level</th><th>Multiplier</th><th>TDEE (calories)</th></tr></thead><tbody>{rows}</tbody></table>
<p>Eating at TDEE roughly maintains weight. Many people aiming to lose weight slowly start with a modest deficit of 10 to 20 percent below TDEE rather than a large cut.</p>
<h2>Choosing an Honest Activity Level</h2>
<p>Most people overestimate it. If you sit most of the day and work out three times a week, "lightly active" is usually closer than "moderately active". An estimate that is too high leads to eating more than you burn. Track weight and intake for two to three weeks and adjust the estimate to match what actually happens.</p>
<h2>What TDEE Does Not Tell You</h2>
<ul><li>It is an estimate. Individual metabolism can differ from the equation by several hundred calories.</li><li>Weight change shifts TDEE, so recalculate as your weight changes.</li><li>It does not consider medical conditions or medications. Talk to a clinician or registered dietitian before major diet changes.</li></ul>
<p>Next, split your target into protein, carbs and fat with the <a href="macro-calculator.html">macro calculator</a>.</p>''',
'extra_faqs':[{'q':'Is TDEE the same as calories needed to lose weight?','a':'No. TDEE is the maintenance level. To lose weight you eat below it; to gain weight you eat above it.'},
 {'q':'How accurate is a TDEE calculator?','a':'It gives a starting estimate, not a measurement. Compare it with your real weight trend over a few weeks and adjust by 100 to 200 calories if needed.'},
 {'q':'What is the difference between BMR and TDEE?','a':'BMR is the energy your body uses at rest. TDEE adds the calories used for daily movement, exercise and digesting food.'}],
'sources':[{'title':'Dietary Guidelines for Americans','url':'https://www.dietaryguidelines.gov/'}]}

# calorie
out['calorie-calculator']={'sections':f'''<h2>Worked Example: Setting a Calorie Target</h2>
<p>A 35-year-old woman who is 5'6" and 150 lb with light exercise needs about <strong>{m(bmr*1.375)} calories</strong> a day to maintain her weight (Mifflin-St Jeor with a 1.375 activity factor). A 500-calorie daily deficit would put her near <strong>{m(bmr*1.375-500)}</strong>.</p>
<div class="example"><p>Rule of thumb: about 3,500 calories equals one pound of body fat, so a 500-calorie daily deficit points to roughly one pound per week. Real results vary, and the rate usually slows over time.</p></div>
<h2>Safe Limits</h2>
<p>Very low calorie intakes can cause nutrient gaps and muscle loss, and are best done under medical supervision. As a general guide, many calculators and clinicians avoid recommending targets below about 1,200 calories for women or 1,500 for men without supervision. Pregnancy, breastfeeding, adolescence and medical conditions change the numbers, so check with a clinician.</p>
<h2>Getting More From the Number</h2>
<ul><li>Pair calories with protein, carbs and fat using the <a href="macro-calculator.html">macro calculator</a>.</li><li>See how exercise changes the picture with the <a href="calories-burned-calculator.html">calories burned calculator</a>.</li><li>Check your starting point with the <a href="bmi-calculator.html">BMI calculator</a>.</li></ul>''',
'extra_faqs':[{'q':'How many calories should I eat a day to lose weight?','a':'Start from your maintenance calories and subtract a moderate amount, commonly 250 to 500 per day. Avoid cutting too low, and check with a clinician if you have health conditions.'},
 {'q':'Do I need to eat back exercise calories?','a':'Many activity multipliers already include typical exercise. If you add extra workouts beyond your chosen activity level, you may need slightly more food.'},
 {'q':'Why have I stopped losing weight?','a':'As weight falls, maintenance calories fall too. Recalculate with your new weight and review your intake and activity.'}],
'sources':[{'title':'Dietary Guidelines for Americans','url':'https://www.dietaryguidelines.gov/'}]}

# calories burned
def burn(met,lb,mins): return met*3.5*kg(lb)/200*mins
out['calories-burned-calculator']={'sections':f'''<h2>Worked Example: 170 lb, 30 Minutes</h2>
<p>The formula is calories per minute = MET × 3.5 × body weight in kg ÷ 200. For a 170 lb person (about {kg(170):.1f} kg) over 30 minutes, using commonly published MET values:</p>
<table><thead><tr><th>Activity</th><th>MET</th><th>Calories in 30 min</th></tr></thead><tbody><tr><td>Brisk walking (about 3.5 mph)</td><td>4.3</td><td>{m(burn(4.3,170,30))}</td></tr><tr><td>Cycling, moderate effort</td><td>8.0</td><td>{m(burn(8,170,30))}</td></tr><tr><td>Running (about 6 mph)</td><td>9.8</td><td>{m(burn(9.8,170,30))}</td></tr></tbody></table>
<h2>Why Your Watch May Disagree</h2>
<p>MET-based estimates use averages. Fitness level, terrain, wind, heart rate and technique all change the real number, and devices differ in how they estimate it. Treat any figure as a rough guide, not a precise count.</p>
<h2>Using the Result</h2>
<ul><li>Heavier people burn more for the same activity, so the figure rises with weight.</li><li>Do not treat exercise as a license to eat large amounts; the calories burned are often smaller than expected.</li><li>Combine this with your <a href="tdee-calculator.html">TDEE</a> to see the larger picture.</li></ul>''',
'extra_faqs':[{'q':'What is a MET?','a':'A MET, or metabolic equivalent, compares the energy cost of an activity with resting. One MET is the energy used sitting quietly, so a 4 MET activity uses about four times as much.'},
 {'q':'Which burns more calories, running or walking?','a':'Running burns more per minute at the same body weight. Walking can still add up, since people can sustain it for longer.'},
 {'q':'Does body weight change calories burned?','a':'Yes. A heavier person uses more energy for the same movement, so the same workout burns more calories.'}],
'sources':[{'title':'CDC: Physical activity basics','url':'https://www.cdc.gov/bmi/'}]}
# fix questionable CDC source: use NHLBI
out['calories-burned-calculator']['sources']=[{'title':'NHLBI: Healthy lifestyle resources','url':'https://www.nhlbi.nih.gov/'}]

# healthy weight (5'6")
lo=18.5*66**2/703; hi=24.9*66**2/703
out['healthy-weight-calculator']={'sections':f'''<h2>Worked Example: 5'6"</h2>
<p>The weight range for a BMI of 18.5 to 24.9 is found with weight (lb) = BMI × height² (in) ÷ 703. At 66 inches, that is about <strong>{lo:.0f} to {hi:.0f} lb</strong>. Someone at 5'6" and 180 lb has a BMI near {703*180/66**2:.1f}, above that range.</p>
<h2>Why a Range, Not a Number</h2>
<p>Healthy bodies come in many sizes. A range recognizes differences in frame, muscle mass and age. Where you sit within it matters less than other signs of health such as blood pressure, blood sugar, fitness and how you feel.</p>
<h2>Limits of the BMI Range</h2>
<ul><li>BMI does not separate muscle from fat, so very muscular people can fall into "overweight" while being healthy.</li><li>Older adults may do better at the upper end of the range.</li><li>Ethnic background and body shape can change risk at a given BMI.</li><li>Waist size is a useful addition; see the <a href="body-type-calculator.html">body type calculator</a>.</li></ul>
<p>For your exact BMI, use the <a href="bmi-calculator.html">BMI calculator</a>. Talk to your doctor about personal weight goals.</p>''',
'extra_faqs':[{'q':'What is a healthy weight for my height?','a':'It is the weight that gives a BMI between 18.5 and 24.9. Enter your height and the calculator converts that into pounds or kilograms.'},
 {'q':'Is a BMI of 25 unhealthy?','a':'A BMI of 25 is the start of the overweight category, but it is only a screening measure. Waist size, fitness and lab results give a fuller view.'},
 {'q':'Does age change the healthy weight range?','a':'The standard BMI range is the same for adults, but some doctors accept slightly higher values in older adults. Ask your clinician what is right for you.'}],
'sources':[{'title':'CDC: About adult BMI','url':'https://www.cdc.gov/bmi/'}]}

# ideal weight Devine female 5'6" and male 5'10"
dev_f=45.5+2.3*6; dev_m=50+2.3*10
out['ideal-weight-calculator']={'sections':f'''<h2>Worked Example: Devine Formula</h2>
<p>The Devine formula starts at 50 kg for men or 45.5 kg for women at 5 feet and adds 2.3 kg for each inch above that. A woman who is 5'6" gets 45.5 + 2.3 × 6 = <strong>{dev_f:.1f} kg ({dev_f*2.20462:.0f} lb)</strong>. A man who is 5'10" gets 50 + 2.3 × 10 = <strong>{dev_m:.1f} kg ({dev_m*2.20462:.0f} lb)</strong>.</p>
<p>Other formulas, such as Robinson, Miller and Hamwi, give somewhat different answers, which is why the calculator shows them side by side.</p>
<h2>Where These Formulas Come From</h2>
<p>Devine's formula was created in 1974 to help estimate medication doses, not to set weight goals. Several formulas have been in use since, each built on small samples. None accounts for muscle, bone structure or age.</p>
<h2>A More Useful Way to Use the Result</h2>
<ul><li>Treat it as a reference point, not a target you must hit.</li><li>Compare it with the healthy BMI range on the <a href="healthy-weight-calculator.html">healthy weight calculator</a>.</li><li>Consider body composition with the <a href="body-fat-calculator.html">body fat calculator</a>.</li></ul>''',
'extra_faqs':[{'q':'Which ideal weight formula is most accurate?','a':'None is clearly the best. They all give an estimate based on height and sex. Use the spread across formulas as a range and rely on health measures too.'},
 {'q':'Does ideal body weight include muscle?','a':'Formulas ignore body composition, so an athletic person can weigh more than the result and still be healthy.'},
 {'q':'Why do the formulas give different results?','a':'They were created from different groups of people and for different purposes, so their assumptions about height and weight differ.'}],
'sources':[{'title':'CDC: About adult BMI','url':'https://www.cdc.gov/bmi/'}]}

# overweight
bmi=703*200/69**2; ub=24.9*69**2/703
out['overweight-calculator']={'sections':f'''<h2>Worked Example: 5'9" and 200 lb</h2>
<p>BMI = 703 × 200 ÷ 69² ≈ <strong>{bmi:.1f}</strong>, in the overweight range (25 to 29.9). The top of the healthy range at this height (BMI 24.9) is about <strong>{ub:.0f} lb</strong>, so the amount above it is about <strong>{200-ub:.0f} lb</strong>.</p>
<div class="example"><p>Losing 5 to 10 percent of body weight, here 10 to 20 lb, is a common first goal, and is associated with health benefits for many people.</p></div>
<h2>Setting Goals That Last</h2>
<ul><li>Aim for gradual change, often 1 to 2 pounds a week at most.</li><li>Pick habits you can keep: regular activity, sleep, and food you enjoy.</li><li>Use the <a href="calorie-calculator.html">calorie calculator</a> to set a moderate deficit.</li></ul>
<h2>What This Number Cannot Say</h2>
<p>Excess weight on a chart is not a diagnosis. Muscle mass, waist size and conditions such as high blood pressure or diabetes matter more for health decisions. Discuss goals with your doctor.</p>''',
'extra_faqs':[{'q':'How many pounds overweight am I?','a':'The calculator compares your weight with the top of the healthy BMI range for your height. The difference is the amount above it.'},
 {'q':'Is a BMI of 27 bad?','a':'It falls in the overweight range. Health risk depends on other factors, so ask your doctor to interpret it with your waist size and test results.'},
 {'q':'How fast should I lose weight?','a':'Slow, steady loss is generally easier to maintain. Many guidelines suggest around 1 to 2 pounds a week for adults, but individual advice should come from a clinician.'}],
'sources':[{'title':'CDC: About adult BMI','url':'https://www.cdc.gov/bmi/'}]}

# lean body mass (Boer) male 180 lb 70 in
w=kg(180); h=cm(70)
lbm=.407*w+.267*h-19.2
out['lean-body-mass-calculator']={'sections':f'''<h2>Worked Example: Boer Formula</h2>
<p>For a man who is 70 in ({h:.0f} cm) and 180 lb ({w:.1f} kg), the Boer formula (0.407 × weight + 0.267 × height − 19.2) gives a lean body mass of about <strong>{lbm:.1f} kg ({lbm*2.20462:.0f} lb)</strong>. The rest, about {w-lbm:.1f} kg, is estimated fat mass, or roughly {100*(w-lbm)/w:.0f}% of body weight.</p>
<h2>Using Lean Mass</h2>
<ul><li>Protein targets are often set per kilogram of lean mass. See the <a href="protein-calculator.html">protein calculator</a>.</li><li>Katch-McArdle BMR uses lean mass directly; see the <a href="bmr-calculator.html">BMR calculator</a>.</li><li>Track change over time rather than one reading.</li></ul>
<h2>Accuracy</h2>
<p>These formulas estimate from height, weight and sex, so they miss differences in muscle and bone. DEXA scans and other clinical methods measure more directly. Use the result as a rough guide.</p>''',
'extra_faqs':[{'q':'What is lean body mass?','a':'It is everything in your body except fat: muscle, bone, organs and water.'},
 {'q':'How do I increase lean body mass?','a':'Resistance training, enough protein and adequate calories and sleep support muscle gain. Results vary by person.'},
 {'q':'Is lean body mass the same as muscle mass?','a':'No. Lean body mass includes muscle plus bone, organs and body water.'}],
'sources':[{'title':'NIDDK: Healthy living','url':'https://www.niddk.nih.gov/'}]}

# BSA 170 cm 70 kg
H,W=170,70
mos=math.sqrt(H*W/3600); dub=0.007184*W**0.425*H**0.725
out['body-surface-area-calculator']={'sections':f'''<h2>Worked Example: 170 cm and 70 kg</h2>
<p>The Mosteller formula is √(height in cm × weight in kg ÷ 3600). For 170 cm and 70 kg that is √3.306, about <strong>{mos:.2f} m²</strong>. The DuBois formula gives about <strong>{dub:.2f} m²</strong>. The small difference is normal; formulas were derived differently.</p>
<h2>Where BSA Is Used</h2>
<p>Doctors use body surface area to dose some chemotherapy drugs, and to index measurements such as cardiac output or kidney function to body size. The calculator is for information only; clinical dosing must be set by the treating team.</p>
<h2>Related Measures</h2>
<ul><li>Kidney function is often reported per 1.73 m² of BSA; see the <a href="gfr-calculator.html">GFR calculator</a>.</li><li>For height-weight screening, use the <a href="bmi-calculator.html">BMI calculator</a>.</li></ul>''',
'extra_faqs':[{'q':'What is a normal body surface area?','a':'Average adults are often cited around 1.7 m² for women and 1.9 m² for men, but it varies with size.'},
 {'q':'Which BSA formula is best?','a':'Mosteller is the easiest and widely used. Differences between common formulas are typically small for average adults.'},
 {'q':'Can I use this for medication doses?','a':'No. Doses must be prescribed and checked by a clinician or pharmacist.'}],
'sources':[{'title':'NIDDK: Kidney disease information','url':'https://www.niddk.nih.gov/'}]}

for slug,v in out.items():
    v['slug']=slug
    json.dump(v,open(os.path.join(os.path.dirname(__file__),'content',slug+'.json'),'w',encoding='utf8'),ensure_ascii=False,indent=1)
    print(slug,len(re.sub(r'<[^>]+>',' ',v['sections']).split()))
print(round(bmr),round(lo),round(hi),round(dev_f,1),round(bmi,1),round(ub),round(lbm,1),round(mos,3),round(dub,3), [round(burn(x,170,30)) for x in (4.3,8,9.8)])
