let state={scheduleView:"annual",results:null,pieChart:null,lineChart:null,currency:"USD",locale:"en-US"};document.addEventListener("DOMContentLoaded",function(){initializeYearSelects(),initializeDateSelects(),calculate()});function initializeYearSelects(){const t=new Date().getFullYear(),s=document.getElementById("startYear");for(let l=0;l<50;l++){const e=t+l;s.add(new Option(e,e))}}function initializeDateSelects(){const t=new Date;document.getElementById("startMonth").value=t.getMonth(),document.getElementById("startYear").value=t.getFullYear()}function setCurrency(t){state.currency=t,state.locale=t==="INR"?"en-IN":"en-US";const s=t==="INR"?"\u20B9":"$";document.querySelectorAll(".dynamic-symbol").forEach(l=>{l.textContent=s}),calculate()}function setScheduleView(t){state.scheduleView=t,document.getElementById("annualTab").classList.toggle("active",t==="annual"),document.getElementById("monthlyTab").classList.toggle("active",t==="monthly"),document.getElementById("scheduleCol1").textContent=t==="annual"?"Year":"Month",renderScheduleTable()}function calculate(){const t=parseFloat(document.getElementById("loanAmount").value)||0,s=parseFloat(document.getElementById("loanTermYears").value)||0,l=parseFloat(document.getElementById("loanTermMonths").value)||0,e=parseFloat(document.getElementById("interestRate").value)||0,r=parseInt(document.getElementById("startMonth").value),n=parseInt(document.getElementById("startYear").value),o=s*12+l,d=e/100/12;let c=0;d===0?c=t/o:o>0&&(c=t*(d*Math.pow(1+d,o))/(Math.pow(1+d,o)-1)),isFinite(c)||(c=0);const a=c*o,y=a-t,u=[];let i=t,b=0,I=0;const f=new Date(n,r);for(let h=1;h<=o&&i>0;h++){const g=new Date(f);g.setMonth(g.getMonth()+h-1);const p=i*d;let m=c-p;if(i<m&&(m=i),i-=m,i<0&&(i=0),b+=p,I+=m+p,u.push({month:h,date:new Date(g),payment:m+p,principal:m,interest:p,balance:i}),i<=0)break}state.results={loanAmount:t,monthlyPayment:c,totalPayment:a,totalInterest:y,schedule:u,payoffDate:u.length>0?u[u.length-1].date:f},renderResults()}function renderResults(){if(!state.results)return;document.getElementById("resultsPlaceholder").style.display="none",document.getElementById("resultsContent").style.display="block",document.getElementById("amortizationSection").style.display="block",document.getElementById("monthlyPaymentDisplay").textContent=formatCurrency(state.results.monthlyPayment);const t=state.results;let s=`
    <tr>
      <td class="muted">Principal</td>
      <td>${formatCurrency(t.loanAmount)}</td>
    </tr>
    <tr>
      <td class="muted">Total Interest</td>
      <td>${formatCurrency(t.totalInterest)}</td>
    </tr>
    <tr class="total-row">
      <td>Total Payment</td>
      <td>${formatCurrency(t.totalPayment)}</td>
    </tr>
  `;document.getElementById("breakdownTableBody").innerHTML=s;const l=`
    <div class="stat-row">
      <span class="stat-label">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 2v20"></path>
          <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
        </svg>
        Loan Amount
      </span>
      <span class="stat-value">${formatCurrency(t.loanAmount)}</span>
    </div>
    <div class="stat-row">
      <span class="stat-label muted">Total of ${t.schedule.length} Payments</span>
      <span class="stat-value">${formatCurrency(t.totalPayment)}</span>
    </div>
    <div class="stat-row">
      <span class="stat-label muted">Total Interest</span>
      <span class="stat-value rose">${formatCurrency(t.totalInterest)}</span>
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
      <span class="stat-value">${formatDate(t.payoffDate)}</span>
    </div>
  `;document.getElementById("summaryStats").innerHTML=l,renderPieChart(),renderLineChart(),renderScheduleTable()}function renderPieChart(){const t=state.results,s=document.getElementById("pieChart").getContext("2d");state.pieChart&&state.pieChart.destroy();const l=[{label:"Principal",value:t.loanAmount,color:"hsl(185, 80%, 40%)"},{label:"Interest",value:t.totalInterest,color:"hsl(350, 89%, 60%)"}],e=l.filter(n=>n.value>0);state.pieChart=new Chart(s,{type:"doughnut",data:{labels:e.map(n=>n.label),datasets:[{data:e.map(n=>n.value),backgroundColor:e.map(n=>n.color),borderWidth:0,hoverOffset:4}]},options:{responsive:!0,maintainAspectRatio:!1,cutout:"60%",plugins:{legend:{display:!1},tooltip:{callbacks:{label:function(n){const o=n.dataset.data.reduce((c,a)=>c+a,0),d=(n.raw/o*100).toFixed(0);return`${n.label}: ${formatCurrency(n.raw)} (${d}%)`}}}}}});const r=l.map(n=>`
    <div class="legend-item">
      <div class="legend-dot" style="background: ${n.color}"></div>
      <span>${n.label}</span>
    </div>
  `).join("");document.getElementById("chartLegend").innerHTML=r}function renderLineChart(){const t=state.results,s=document.getElementById("lineChart").getContext("2d");state.lineChart&&state.lineChart.destroy();const l=t.schedule.filter((e,r)=>r===0||e.month%12===0||r===t.schedule.length-1);state.lineChart=new Chart(s,{type:"line",data:{labels:l.map(e=>formatDate(e.date)),datasets:[{label:"Balance",data:l.map(e=>e.balance),borderColor:"hsl(185, 80%, 40%)",backgroundColor:"hsla(185, 80%, 40%, 0.1)",fill:!0,tension:.4}]},options:{responsive:!0,maintainAspectRatio:!1,interaction:{intersect:!1,mode:"index"},plugins:{legend:{position:"top"},tooltip:{callbacks:{label:function(e){return`${e.dataset.label}: ${formatCurrency(e.raw)}`}}}},scales:{x:{grid:{display:!1}},y:{ticks:{callback:function(e){return state.currency==="INR"?"\u20B9"+(e/1e3).toFixed(0)+"K":"$"+(e/1e3).toFixed(0)+"K"}}}}}})}function renderScheduleTable(){var s;const t=state.results;if(state.scheduleView==="annual"){const l=[];let e=(s=t.schedule[0])==null?void 0:s.date.getFullYear(),r=0,n=0,o=t.loanAmount,d=1;t.schedule.forEach((a,y)=>{const u=a.date.getFullYear();u!==e||y===t.schedule.length-1?(y===t.schedule.length-1&&(r+=a.interest,n+=a.principal,o=a.balance),l.push({year:d,date:e,interest:r,principal:n,balance:y===t.schedule.length-1?a.balance:o}),d++,e=u,r=a.interest,n=a.principal,o=a.balance):(r+=a.interest,n+=a.principal,o=a.balance)});const c=l.map(a=>`
      <tr>
        <td>${a.year}</td>
        <td>${a.date}</td>
        <td>${formatCurrency(a.interest)}</td>
        <td>${formatCurrency(a.principal)}</td>
        <td>${formatCurrency(a.balance)}</td>
      </tr>
    `).join("");document.getElementById("scheduleTableBody").innerHTML=c}else{const l=t.schedule.map(e=>`
      <tr>
        <td>${e.month}</td>
        <td>${formatDate(e.date)}</td>
        <td>${formatCurrency(e.interest)}</td>
        <td>${formatCurrency(e.principal)}</td>
        <td>${formatCurrency(e.balance)}</td>
      </tr>
    `).join("");document.getElementById("scheduleTableBody").innerHTML=l}}function clearForm(){document.getElementById("loanAmount").value=1e4,document.getElementById("loanTermYears").value=5,document.getElementById("loanTermMonths").value=0,document.getElementById("interestRate").value=7.5,document.getElementById("resultsContent").style.display="none",document.getElementById("resultsPlaceholder").style.display="flex",document.getElementById("amortizationSection").style.display="none"}function formatCurrency(t){return new Intl.NumberFormat(state.locale,{style:"currency",currency:state.currency,minimumFractionDigits:0,maximumFractionDigits:2}).format(t)}function formatDate(t){return t.toLocaleDateString("en-US",{month:"short",year:"numeric"})}
