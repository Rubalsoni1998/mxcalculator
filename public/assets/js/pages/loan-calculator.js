let state={scheduleView:"annual",results:null,pieChart:null,lineChart:null,currency:"USD",locale:"en-US"};document.addEventListener("DOMContentLoaded",function(){initializeYearSelects(),initializeDateSelects(),calculate()});function initializeYearSelects(){const e=new Date().getFullYear(),s=document.getElementById("startYear"),a=document.getElementById("extraOneTimeYear");for(let o=0;o<50;o++){const t=e+o;s.add(new Option(t,t)),a.add(new Option(t,t))}a.value=e+1}function initializeDateSelects(){const e=new Date;document.getElementById("startMonth").value=e.getMonth(),document.getElementById("startYear").value=e.getFullYear()}function setCurrency(e){state.currency=e,state.locale=e==="INR"?"en-IN":"en-US";const s=e==="INR"?"\u20B9":"$";document.querySelectorAll(".dynamic-symbol").forEach(a=>{a.textContent=s}),calculate()}function toggleMoreOptions(){const e=document.getElementById("moreOptionsBtn"),s=document.getElementById("moreOptionsContent");e.classList.toggle("open"),s.classList.toggle("open")}function setScheduleView(e){state.scheduleView=e,document.getElementById("annualTab").classList.toggle("active",e==="annual"),document.getElementById("monthlyTab").classList.toggle("active",e==="monthly"),document.getElementById("scheduleCol1").textContent=e==="annual"?"Year":"Month",renderScheduleTable()}function calculate(){const e=parseFloat(document.getElementById("loanAmount").value)||0,s=parseInt(document.getElementById("loanTerm").value)||5,a=parseFloat(document.getElementById("interestRate").value)||0,o=parseInt(document.getElementById("startMonth").value),t=parseInt(document.getElementById("startYear").value),r=a/100/12,c=s*12;let i;r===0?i=e/c:i=e*(r*Math.pow(1+r,c))/(Math.pow(1+r,c)-1);const n=parseFloat(document.getElementById("extraMonthlyPayment").value)||0,l=parseFloat(document.getElementById("extraYearlyPayment").value)||0,d=parseInt(document.getElementById("extraYearlyMonth").value),u=parseFloat(document.getElementById("extraOneTimePayment").value)||0,C=parseInt(document.getElementById("extraOneTimeMonth").value),w=parseInt(document.getElementById("extraOneTimeYear").value),p=[];let m=e,B=0,E=0;const x=new Date(t,o);for(let g=1;g<=c&&m>0;g++){const y=new Date(x);y.setMonth(y.getMonth()+g-1);const b=m*r;let I=i-b,f=n;y.getMonth()===d&&(f+=l),y.getMonth()===C&&y.getFullYear()===w&&(f+=u);const v=Math.min(I+f,m),h=Math.max(0,v-I);if(I=v-h,m-=v,B+=b,E+=i+h,p.push({month:g,date:new Date(y),payment:i+h,principal:I+h,interest:b,balance:Math.max(0,m),extraPayment:h}),m<=0)break}const M=E;state.results={loanAmount:e,monthlyPayment:i,totalPayment:M,totalInterest:B,schedule:p,payoffDate:p.length>0?p[p.length-1].date:x},renderResults()}function renderResults(){if(!state.results)return;document.getElementById("resultsPlaceholder").style.display="none",document.getElementById("resultsContent").style.display="block",document.getElementById("amortizationSection").style.display="block",document.getElementById("monthlyPaymentDisplay").textContent=formatCurrency(state.results.monthlyPayment);const e=state.results;let s=`
    <tr>
      <td class="muted">Loan Principal</td>
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
  `;document.getElementById("breakdownTableBody").innerHTML=s;const a=`
    <div class="stat-row">
      <span class="stat-label">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 2v20"></path>
          <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
        </svg>
        Loan Amount
      </span>
      <span class="stat-value">${formatCurrency(e.loanAmount)}</span>
    </div>
    <div class="stat-row">
      <span class="stat-label muted">Total of ${e.schedule.length} Payments</span>
      <span class="stat-value">${formatCurrency(e.totalPayment)}</span>
    </div>
    <div class="stat-row">
      <span class="stat-label muted">Total Interest</span>
      <span class="stat-value rose">${formatCurrency(e.totalInterest)}</span>
    </div>
    <div class="stat-row">
      <span class="stat-label">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect width="18" height="18" x="3" y="4" rx="2" ry="2"></rect>
          <line x1="16" x2="16" y1="2" y2="6"></line>
          <line x1="8" x2="8" y1="2" y2="6"></line>
          <line x1="3" x2="21" y1="10" y2="10"></line>
        </svg>
        Payoff Date
      </span>
      <span class="stat-value">${formatDate(e.payoffDate)}</span>
    </div>
  `;document.getElementById("summaryStats").innerHTML=a,renderPieChart(),renderLineChart(),renderScheduleTable()}function renderPieChart(){const e=state.results,s=document.getElementById("pieChart").getContext("2d");state.pieChart&&state.pieChart.destroy();const a=[{label:"Principal",value:e.loanAmount,color:"hsl(221, 83%, 53%)"},{label:"Interest",value:e.totalInterest,color:"hsl(38, 92%, 50%)"}];state.pieChart=new Chart(s,{type:"doughnut",data:{labels:a.map(t=>t.label),datasets:[{data:a.map(t=>t.value),backgroundColor:a.map(t=>t.color),borderWidth:0,hoverOffset:4}]},options:{responsive:!0,maintainAspectRatio:!1,cutout:"60%",plugins:{legend:{display:!1},tooltip:{callbacks:{label:function(t){const r=t.dataset.data.reduce((i,n)=>i+n,0),c=(t.raw/r*100).toFixed(0);return`${t.label}: ${formatCurrency(t.raw)} (${c}%)`}}}}}});const o=a.map(t=>`
    <div class="legend-item">
      <div class="legend-dot" style="background: ${t.color}"></div>
      <span>${t.label}</span>
    </div>
  `).join("");document.getElementById("chartLegend").innerHTML=o}function renderLineChart(){var i;const e=state.results,s=document.getElementById("lineChart").getContext("2d");state.lineChart&&state.lineChart.destroy();const a=[];let o=(i=e.schedule[0])==null?void 0:i.date.getFullYear(),t=0,r=0,c=1;e.schedule.forEach((n,l)=>{var u;const d=n.date.getFullYear();d!==o||l===e.schedule.length-1?(l===e.schedule.length-1&&(t+=n.interest,r+=n.principal),a.push({year:c,balance:l===e.schedule.length-1?n.balance:((u=e.schedule[l-1])==null?void 0:u.balance)||0,interest:t,principal:r}),c++,o=d,t=n.interest,r=n.principal):(t+=n.interest,r+=n.principal)}),state.lineChart=new Chart(s,{type:"line",data:{labels:a.map(n=>n.year),datasets:[{label:"Balance",data:a.map(n=>n.balance),borderColor:"hsl(221, 83%, 53%)",backgroundColor:"hsla(221, 83%, 53%, 0.1)",fill:!0,tension:.4},{label:"Interest",data:a.map(n=>n.interest),borderColor:"hsl(38, 92%, 50%)",backgroundColor:"hsla(38, 92%, 50%, 0.1)",fill:!0,tension:.4},{label:"Principal",data:a.map(n=>n.principal),borderColor:"hsl(160, 84%, 39%)",backgroundColor:"hsla(160, 84%, 39%, 0.1)",fill:!0,tension:.4}]},options:{responsive:!0,maintainAspectRatio:!1,interaction:{intersect:!1,mode:"index"},plugins:{legend:{position:"top"},tooltip:{callbacks:{label:function(n){return`${n.dataset.label}: ${formatCurrency(n.raw)}`}}}},scales:{x:{title:{display:!0,text:"Year"},grid:{display:!1}},y:{title:{display:!1},ticks:{callback:function(n){return state.currency==="INR"?"\u20B9"+(n/1e3).toFixed(0)+"K":"$"+(n/1e3).toFixed(0)+"K"}},grid:{color:"hsl(210, 20%, 90%)"}}}}})}function renderScheduleTable(){var s;const e=state.results;if(state.scheduleView==="annual"){const a=[];let o=(s=e.schedule[0])==null?void 0:s.date.getFullYear(),t=0,r=0,c=e.loanAmount,i=1;e.schedule.forEach((l,d)=>{const u=l.date.getFullYear();u!==o||d===e.schedule.length-1?(d===e.schedule.length-1&&(t+=l.interest,r+=l.principal,c=l.balance),a.push({year:i,date:o,interest:t,principal:r,balance:d===e.schedule.length-1?l.balance:c}),i++,o=u,t=l.interest,r=l.principal,c=l.balance):(t+=l.interest,r+=l.principal,c=l.balance)});const n=a.map(l=>`
      <tr>
        <td>${l.year}</td>
        <td>${l.date}</td>
        <td>${formatCurrency(l.interest)}</td>
        <td>${formatCurrency(l.principal)}</td>
        <td>${formatCurrency(l.balance)}</td>
      </tr>
    `).join("");document.getElementById("scheduleTableBody").innerHTML=n}else{const a=e.schedule.map(o=>`
      <tr>
        <td>${o.month}</td>
        <td>${formatDate(o.date)}</td>
        <td>${formatCurrency(o.interest)}</td>
        <td>${formatCurrency(o.principal)}</td>
        <td>${formatCurrency(o.balance)}</td>
      </tr>
    `).join("");document.getElementById("scheduleTableBody").innerHTML=a}}function clearForm(){document.getElementById("loanAmount").value=1e4,document.getElementById("loanTerm").value=5,document.getElementById("interestRate").value=5.5,document.getElementById("extraMonthlyPayment").value=0,document.getElementById("extraYearlyPayment").value=0,document.getElementById("extraOneTimePayment").value=0,document.getElementById("resultsContent").style.display="none",document.getElementById("resultsPlaceholder").style.display="flex",document.getElementById("amortizationSection").style.display="none"}function formatCurrency(e){return new Intl.NumberFormat(state.locale,{style:"currency",currency:state.currency,minimumFractionDigits:0,maximumFractionDigits:2}).format(e)}function formatDate(e){return e.toLocaleDateString("en-US",{month:"short",year:"numeric"})}
