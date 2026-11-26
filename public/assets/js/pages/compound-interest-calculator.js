const mxCur=window.mxCurrency&&window.mxCurrency.get()||{code:"USD",locale:"en-US",symbol:"$"};let state={currency:mxCur.code,locale:mxCur.locale,pieChart:null,lineChart:null};document.addEventListener("DOMContentLoaded",function(){calculate()});function applyCurrencySymbols(){mxCur.code!=="USD"&&document.querySelectorAll(".dynamic-symbol, .dynamic-symbol-btn").forEach(e=>{e.textContent=mxCur.symbol})}applyCurrencySymbols();function calculate(){const e=parseFloat(document.getElementById("baseAmount").value)||0,r=(parseFloat(document.getElementById("interestRate").value)||0)/100,l=parseFloat(document.getElementById("years").value)||0,n=parseInt(document.getElementById("compoundFreq").value),t=parseFloat(document.getElementById("monthlyDeposit").value)||0,i=e*Math.pow(1+r/n,n*l);let a=e,o=e,s=[];const y=l*12;let u=0,d=0;for(let c=1;c<=y;c++){a+=t,o+=t;const h=Math.pow(1+r/n,n/12)-1,m=a*h;a+=m,d+=m,c%12===0&&(u++,s.push({year:u,interest:d,balance:a,totalInterest:a-o}),d=0)}const p=a-o;state.results={principal:e,totalDeposits:o-e,totalPrincipal:o,totalInterest:p,futureValue:a,schedule:s},renderResults()}function renderResults(){if(!state.results)return;document.getElementById("resultsPlaceholder").style.display="none",document.getElementById("resultsContent").style.display="block",document.getElementById("graphSection").style.display="block";const e=state.results;document.getElementById("resultValueDisplay").textContent=formatCurrency(e.futureValue);const r=document.getElementById("breakdownTableBody");r.innerHTML=`
    <tr>
        <td class="muted">Principal</td>
        <td>${formatCurrency(e.principal)}</td>
    </tr>
     <tr>
        <td class="muted">Total Deposits</td>
        <td>${formatCurrency(e.totalDeposits)}</td>
    </tr>
     <tr>
        <td class="muted">Total Interest</td>
        <td>${formatCurrency(e.totalInterest)}</td>
    </tr>
    <tr class="total-row">
        <td>Total Value</td>
        <td>${formatCurrency(e.futureValue)}</td>
    </tr>
  `;const l=document.getElementById("scheduleTableBody");l.innerHTML="",e.schedule.forEach(n=>{const t=document.createElement("tr");t.innerHTML=`
        <td>Year ${n.year}</td>
        <td>${formatCurrency(n.interest)}</td>
        <td>${formatCurrency(n.totalInterest)}</td>
        <td>${formatCurrency(n.balance)}</td>
     `,l.appendChild(t)}),renderCharts()}function renderCharts(){const e=state.results,r=document.getElementById("pieChart").getContext("2d");state.pieChart&&state.pieChart.destroy();const l=[{label:"Principal + Deposits",value:e.totalPrincipal,color:"hsl(245, 60%, 80%)"},{label:"Interest",value:e.totalInterest,color:"hsl(245, 75%, 60%)"}];state.pieChart=new Chart(r,{type:"doughnut",data:{labels:l.map(t=>t.label),datasets:[{data:l.map(t=>t.value),backgroundColor:l.map(t=>t.color),borderWidth:0,hoverOffset:4}]},options:{responsive:!0,maintainAspectRatio:!1,cutout:"60%",plugins:{legend:{display:!0,position:"bottom"},tooltip:{callbacks:{label:function(t){const i=t.dataset.data.reduce((o,s)=>o+s,0),a=(t.raw/i*100).toFixed(1);return`${t.label}: ${formatCurrency(t.raw)} (${a}%)`}}}}}});const n=document.getElementById("lineChart").getContext("2d");state.lineChart&&state.lineChart.destroy(),state.lineChart=new Chart(n,{type:"line",data:{labels:e.schedule.map(t=>`Year ${t.year}`),datasets:[{label:"Total Balance",data:e.schedule.map(t=>t.balance),borderColor:"hsl(245, 75%, 60%)",backgroundColor:"hsla(245, 75%, 60%, 0.1)",fill:!0,tension:.4}]},options:{responsive:!0,maintainAspectRatio:!1,interaction:{intersect:!1,mode:"index"},plugins:{legend:{display:!1},tooltip:{callbacks:{label:function(t){return`Balance: ${formatCurrency(t.raw)}`}}}},scales:{x:{grid:{display:!1}},y:{ticks:{callback:function(t){return t>=1e3?(t/1e3).toFixed(0)+"k":t}}}}}})}function clearForm(){document.getElementById("baseAmount").value=5e3,document.getElementById("interestRate").value=5,document.getElementById("years").value=10,document.getElementById("monthlyDeposit").value=100,document.getElementById("resultsContent").style.display="none",document.getElementById("graphSection").style.display="none",document.getElementById("resultsPlaceholder").style.display="flex"}function formatCurrency(e){return isNaN(e)?"Error":new Intl.NumberFormat(state.locale,{style:"currency",currency:state.currency,minimumFractionDigits:0,maximumFractionDigits:0}).format(e)}
