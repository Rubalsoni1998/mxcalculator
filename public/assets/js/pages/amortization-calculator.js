const mxCur=window.mxCurrency&&window.mxCurrency.get()||{code:"USD",locale:"en-US",symbol:"$"};let state={scheduleView:"annual",results:null,pieChart:null,lineChart:null,currency:mxCur.code,locale:mxCur.locale};document.addEventListener("DOMContentLoaded",function(){initializeYearSelects(),initializeDateSelects(),calculate()});function initializeYearSelects(){const e=new Date().getFullYear(),o=document.getElementById("startYear");for(let l=0;l<50;l++){const t=e+l;o.add(new Option(t,t))}}function initializeDateSelects(){const e=new Date;document.getElementById("startMonth").value=e.getMonth(),document.getElementById("startYear").value=e.getFullYear()}function applyCurrencySymbols(){mxCur.code!=="USD"&&document.querySelectorAll(".dynamic-symbol, .dynamic-symbol-btn").forEach(e=>{e.textContent=mxCur.symbol})}applyCurrencySymbols();function toggleMoreOptions(){const e=document.getElementById("moreOptionsBtn"),o=document.getElementById("moreOptionsContent");e.classList.toggle("open"),o.classList.toggle("open")}function setScheduleView(e){state.scheduleView=e,document.getElementById("annualTab").classList.toggle("active",e==="annual"),document.getElementById("monthlyTab").classList.toggle("active",e==="monthly"),document.getElementById("scheduleCol1").textContent=e==="annual"?"Year":"Month",renderScheduleTable()}function calculate(){const e=parseFloat(document.getElementById("loanAmount").value)||0,o=parseFloat(document.getElementById("loanTermYears").value)||0,l=parseFloat(document.getElementById("loanTermMonths").value)||0,t=parseFloat(document.getElementById("interestRate").value)||0,n=parseInt(document.getElementById("startMonth").value),s=parseInt(document.getElementById("startYear").value),c=parseFloat(document.getElementById("extraMonthly").value)||0,i=parseFloat(document.getElementById("extraYearly").value)||0,h=parseFloat(document.getElementById("extraOneTime").value)||0;if(e<=0){alert("Please enter a valid loan amount.");return}if(o===0&&l===0){alert("Please enter a valid loan term.");return}const a=o*12+l,r=t/100/12;let d=0;r===0?d=e/a:d=e*(r*Math.pow(1+r,a))/(Math.pow(1+r,a)-1);let m=e,I=0,E=0,v=0;const p=[],C=new Date(s,n);let f=a*2;f<120&&(f=120);for(let y=1;y<=f&&!(m<=.01);y++){let g=m*r,M=d-g,b=c;const B=new Date(C);B.setMonth(B.getMonth()+y-1),y%12===0&&(b+=i),y===1&&(b+=h);let u=M+b;u>m&&(u=m,M=u),m-=u,I+=g,E+=u+g,v++,p.push({month:y,date:new Date(B),interest:g,principal:u,balance:Math.max(0,m),payment:u+g})}state.results={loanAmount:e,monthlyPayment:d,totalPayment:E,totalInterest:I,schedule:p,payoffDate:p.length>0?p[p.length-1].date:C,actualTerms:v},renderResults()}function renderResults(){if(!state.results)return;document.getElementById("resultsPlaceholder").style.display="none",document.getElementById("resultsContent").style.display="block",document.getElementById("amortizationSection").style.display="block";const e=state.results;document.getElementById("monthlyPaymentDisplay").textContent=formatCurrency(e.monthlyPayment);const o=document.getElementById("breakdownTableBody");o.innerHTML=`
    <tr>
        <td class="muted">Principal</td>
        <td>${formatCurrency(e.loanAmount)}</td>
    </tr>
    <tr>
        <td class="muted">Total Interest</td>
        <td>${formatCurrency(e.totalInterest)}</td>
    </tr>
     <tr class="total-row">
        <td>Total Repayment</td>
        <td>${formatCurrency(e.totalPayment)}</td>
    </tr>
  `;const l=document.getElementById("summaryStats");l.innerHTML=`
    <div class="stat-row">
        <span class="stat-label">Number of Payments</span>
        <span class="stat-value">${e.actualTerms}</span>
    </div>
    <div class="stat-row">
        <span class="stat-label">Payoff Date</span>
        <span class="stat-value rose">${formatDate(e.payoffDate)}</span>
    </div>
  `,renderPieChart(),renderLineChart(),renderScheduleTable()}function renderPieChart(){const e=state.results,o=document.getElementById("pieChart").getContext("2d");state.pieChart&&state.pieChart.destroy();const t=[{label:"Principal",value:e.loanAmount,color:"hsl(225, 70%, 45%)"},{label:"Interest",value:e.totalInterest,color:"hsl(350, 89%, 60%)"}].filter(n=>n.value>0);state.pieChart=new Chart(o,{type:"doughnut",data:{labels:t.map(n=>n.label),datasets:[{data:t.map(n=>n.value),backgroundColor:t.map(n=>n.color),borderWidth:0,hoverOffset:4}]},options:{responsive:!0,maintainAspectRatio:!1,cutout:"60%",plugins:{legend:{position:"bottom",labels:{padding:20}},tooltip:{callbacks:{label:function(n){const s=n.dataset.data.reduce((i,h)=>i+h,0),c=(n.raw/s*100).toFixed(0);return`${n.label}: ${formatCurrency(n.raw)} (${c}%)`}}}}}}),document.getElementById("chartLegend").innerHTML=""}function renderLineChart(){const e=state.results,o=document.getElementById("lineChart").getContext("2d");state.lineChart&&state.lineChart.destroy();const l=e.schedule.length>50?e.schedule.filter((t,n)=>n===0||t.month%12===0||n===e.schedule.length-1):e.schedule;state.lineChart=new Chart(o,{type:"line",data:{labels:l.map(t=>formatDate(t.date)),datasets:[{label:"Balance",data:l.map(t=>t.balance),borderColor:"hsl(225, 70%, 45%)",backgroundColor:"hsla(225, 70%, 45%, 0.1)",fill:!0,tension:.4}]},options:{responsive:!0,maintainAspectRatio:!1,interaction:{intersect:!1,mode:"index"},plugins:{legend:{display:!1},tooltip:{callbacks:{label:function(t){return`Balance: ${formatCurrency(t.raw)}`}}}},scales:{x:{grid:{display:!1}},y:{ticks:{callback:function(t){return mxCur.symbol+(t/1e3).toFixed(0)+"k"}}}}}})}function renderScheduleTable(){var o;const e=state.results;if(state.scheduleView==="annual"){const l=[];let t=(o=e.schedule[0])==null?void 0:o.date.getFullYear(),n=0,s=0,c=e.loanAmount,i=1;e.schedule.forEach((a,r)=>{const d=a.date.getFullYear();d!==t||r===e.schedule.length-1?(r===e.schedule.length-1&&(n+=a.interest,s+=a.principal,c=a.balance),l.push({year:i,date:t,interest:n,principal:s,balance:r===e.schedule.length-1?a.balance:c}),i++,t=d,n=a.interest,s=a.principal,c=a.balance):(n+=a.interest,s+=a.principal,c=a.balance)});const h=l.map(a=>`
      <tr>
        <td>${a.year}</td>
        <td>${a.date}</td>
        <td>${formatCurrency(a.interest)}</td>
        <td>${formatCurrency(a.principal)}</td>
        <td>${formatCurrency(a.balance)}</td>
      </tr>
    `).join("");document.getElementById("scheduleTableBody").innerHTML=h}else{const l=e.schedule.map(t=>`
      <tr>
        <td>${t.month}</td>
        <td>${formatDate(t.date)}</td>
        <td>${formatCurrency(t.interest)}</td>
        <td>${formatCurrency(t.principal)}</td>
        <td>${formatCurrency(t.balance)}</td>
      </tr>
    `).join("");document.getElementById("scheduleTableBody").innerHTML=l}}function clearForm(){document.getElementById("loanAmount").value=2e5,document.getElementById("loanTermYears").value=15,document.getElementById("loanTermMonths").value=0,document.getElementById("interestRate").value=6,document.getElementById("extraMonthly").value=0,document.getElementById("extraYearly").value=0,document.getElementById("extraOneTime").value=0,document.getElementById("resultsContent").style.display="none",document.getElementById("resultsPlaceholder").style.display="flex",document.getElementById("amortizationSection").style.display="none"}function formatCurrency(e){return new Intl.NumberFormat(state.locale,{style:"currency",currency:state.currency,minimumFractionDigits:0,maximumFractionDigits:0}).format(e)}function formatDate(e){return e.toLocaleDateString("en-US",{month:"short",year:"numeric"})}
