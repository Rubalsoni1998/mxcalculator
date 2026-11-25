let state={deductionType:"standard",currency:"USD",locale:"en-US",pieChart:null};const TAX_RATES=[.1,.12,.22,.24,.32,.35,.37],DEFAULT_TAX_YEAR="2026",TAX_DATA={2027:{source:"IRS Rev. Proc. 2026-35",standardDeduction:{single:16600,married_joint:33200,married_separate:16600,head_household:24925},limits:{single:[12800,52025,109125,208325,264550,661375],married_joint:[25600,104050,218250,416650,529100,793650],married_separate:[12800,52025,109125,208325,264550,396825],head_household:[18250,69650,109100,208300,264550,661350]}},2026:{source:"IRS Rev. Proc. 2025-32",standardDeduction:{single:16100,married_joint:32200,married_separate:16100,head_household:24150},limits:{single:[12400,50400,105700,201775,256225,640600],married_joint:[24800,100800,211400,403550,512450,768700],married_separate:[12400,50400,105700,201775,256225,384350],head_household:[17700,67450,105700,201750,256200,640600]}},2025:{source:"IRS Rev. Proc. 2024-40 and the One Big Beautiful Bill Act",standardDeduction:{single:15750,married_joint:31500,married_separate:15750,head_household:23625},limits:{single:[11925,48475,103350,197300,250525,626350],married_joint:[23850,96950,206700,394600,501050,751600],married_separate:[11925,48475,103350,197300,250525,375800],head_household:[17e3,64850,103350,197300,250500,626350]}}};function getTaxYearData(t){return TAX_DATA[t]||TAX_DATA[DEFAULT_TAX_YEAR]}function buildBrackets(t,r){const a=getTaxYearData(t).limits[r]||getTaxYearData(t).limits.single;return TAX_RATES.map((e,o)=>({limit:o<a.length?a[o]:1/0,rate:e}))}document.addEventListener("DOMContentLoaded",function(){calculate()});function setCurrency(t){state.currency=t,state.locale=t==="INR"?"en-IN":"en-US";const r=t==="INR"?"\u20B9":"$";document.querySelectorAll(".dynamic-symbol").forEach(a=>{a.textContent=r}),calculate()}function setDeductionType(t){state.deductionType=t,document.getElementById("deductionStandard").className=t==="standard"?"toggle-btn active":"toggle-btn",document.getElementById("deductionItemized").className=t==="itemized"?"toggle-btn active":"toggle-btn",document.getElementById("itemizedInputGroup").style.display=t==="itemized"?"block":"none"}function calculate(){const t=parseFloat(document.getElementById("grossIncome").value)||0,r=document.getElementById("filingStatus").value,a=document.getElementById("taxYear").value;let e=0;state.deductionType==="standard"?e=getTaxYearData(a).standardDeduction[r]||0:e=parseFloat(document.getElementById("itemizedAmount").value)||0;let o=Math.max(0,t-e);const n=buildBrackets(a,r);let i=0,d=0,s=0;for(const l of n)if(o>d){const u=Math.min(o,l.limit)-d;i+=u*l.rate,s=l.rate,d=l.limit}else break;const c=t>0?i/t*100:0,m=t-i;state.results={income:t,deduction:e,taxableIncome:o,tax:i,afterTaxIncome:m,marginalRate:(s*100).toFixed(2),effectiveRate:c.toFixed(2),status:r,year:TAX_DATA[a]?a:DEFAULT_TAX_YEAR,brackets:n},renderResults()}function renderResults(){if(!state.results)return;document.getElementById("resultsPlaceholder").style.display="none",document.getElementById("resultsContent").style.display="block",document.getElementById("bracketsSection").style.display="block";const t=state.results;document.getElementById("resultValueDisplay").textContent=formatCurrency(t.tax);const r=document.getElementById("breakdownTableBody");r.innerHTML=`
    <tr>
        <td class="muted">Gross Income</td>
        <td>${formatCurrency(t.income)}</td>
    </tr>
     <tr>
        <td class="muted">Deduction</td>
        <td>- ${formatCurrency(t.deduction)}</td>
    </tr>
     <tr>
        <td class="muted">Taxable Income</td>
        <td>${formatCurrency(t.taxableIncome)}</td>
    </tr>
    <tr class="total-row">
        <td>Total Tax</td>
        <td>${formatCurrency(t.tax)}</td>
    </tr>
    <tr>
        <td class="muted">After-Tax Income</td>
        <td>${formatCurrency(t.afterTaxIncome)}</td>
    </tr>
    <tr style="background:#fff3e0">
        <td class="muted">Effective Tax Rate</td>
        <td>${t.effectiveRate}%</td>
    </tr>
     <tr style="background:#fff3e0">
        <td class="muted">Marginal Tax Rate</td>
        <td>${t.marginalRate}%</td>
    </tr>
  `,document.getElementById("bracketStatusDisplay").textContent=t.status.replace(/_/g," ").toUpperCase(),document.getElementById("bracketYearDisplay").textContent=t.year,document.getElementById("bracketSourceDisplay").textContent=getTaxYearData(t.year).source;const a=document.getElementById("bracketsTableBody");a.innerHTML="";let e=0,o=0;t.brackets.forEach((n,i)=>{const d=(n.rate*100).toFixed(0)+"%",s=n.limit===1/0?`Over ${formatCurrency(e)}`:`${formatCurrency(e)} - ${formatCurrency(n.limit)}`;let c=0;n.limit!==1/0&&(c=(n.limit-e)*n.rate);const m=n.limit===1/0?`${formatCurrency(o)} + ${d} of amount over ${formatCurrency(e)}`:`${formatCurrency(o)} + ${d} of amount over ${formatCurrency(e)}`,l=document.createElement("tr");t.taxableIncome>e&&(t.taxableIncome<=n.limit||n.limit===1/0)&&(l.style.background="hsl(25, 95%, 90%)",l.style.fontWeight="bold"),l.innerHTML=`
         <td>${d}</td>
         <td>${s}</td>
         <td style="font-size:0.8rem; color:var(--muted-foreground)">${m}</td>
      `,a.appendChild(l),o+=c,e=n.limit}),renderPieChart()}function renderPieChart(){const t=state.results,r=document.getElementById("pieChart").getContext("2d");state.pieChart&&state.pieChart.destroy();const a=[{label:"Tax",value:t.tax,color:"hsl(25, 95%, 53%)"},{label:"After-Tax Income",value:t.afterTaxIncome,color:"hsl(210, 20%, 80%)"}];state.pieChart=new Chart(r,{type:"doughnut",data:{labels:a.map(e=>e.label),datasets:[{data:a.map(e=>e.value),backgroundColor:a.map(e=>e.color),borderWidth:0,hoverOffset:4}]},options:{responsive:!0,maintainAspectRatio:!1,cutout:"60%",plugins:{legend:{display:!0,position:"bottom"},tooltip:{callbacks:{label:function(e){const o=e.dataset.data.reduce((i,d)=>i+d,0),n=(e.raw/o*100).toFixed(1);return`${e.label}: ${formatCurrency(e.raw)} (${n}%)`}}}}}})}function clearForm(){document.getElementById("grossIncome").value="",document.getElementById("itemizedAmount").value=0,setDeductionType("standard"),document.getElementById("resultsContent").style.display="none",document.getElementById("bracketsSection").style.display="none",document.getElementById("resultsPlaceholder").style.display="flex"}function formatCurrency(t){return isNaN(t)?"Error":new Intl.NumberFormat(state.locale,{style:"currency",currency:state.currency,minimumFractionDigits:0,maximumFractionDigits:0}).format(t)}
