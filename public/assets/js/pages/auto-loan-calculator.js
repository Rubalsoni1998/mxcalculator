let state={downPaymentType:"dollar",scheduleView:"annual",results:null,pieChart:null,lineChart:null,currency:"USD",locale:"en-US"};document.addEventListener("DOMContentLoaded",function(){initializeYearSelects(),initializeDateSelects(),calculate()});function initializeYearSelects(){const e=new Date().getFullYear(),s=document.getElementById("startYear");for(let a=0;a<50;a++){const o=e+a;s.add(new Option(o,o))}}function initializeDateSelects(){const e=new Date;document.getElementById("startMonth").value=e.getMonth(),document.getElementById("startYear").value=e.getFullYear()}function setCurrency(e){state.currency=e,state.locale=e==="INR"?"en-IN":"en-US";const s=e==="INR"?"\u20B9":"$";document.querySelectorAll(".dynamic-symbol").forEach(a=>{a.textContent=s}),document.querySelectorAll(".dynamic-symbol-btn").forEach(a=>{a.textContent=s}),calculate()}function setDownPaymentType(e){state.downPaymentType=e,document.getElementById("downPaymentPercent").classList.toggle("active",e==="percent"),document.getElementById("downPaymentDollar").classList.toggle("active",e==="dollar")}function toggleMoreOptions(){const e=document.getElementById("moreOptionsBtn"),s=document.getElementById("moreOptionsContent");e.classList.toggle("open"),s.classList.toggle("open")}function setScheduleView(e){state.scheduleView=e,document.getElementById("annualTab").classList.toggle("active",e==="annual"),document.getElementById("monthlyTab").classList.toggle("active",e==="monthly"),document.getElementById("scheduleCol1").textContent=e==="annual"?"Year":"Month",renderScheduleTable()}function calculate(){const e=parseFloat(document.getElementById("autoPrice").value)||0,s=parseInt(document.getElementById("loanTerm").value)||60,a=parseFloat(document.getElementById("interestRate").value)||0,o=parseFloat(document.getElementById("downPayment").value)||0,n=parseFloat(document.getElementById("tradeInValue").value)||0,r=parseFloat(document.getElementById("tradeInOwed").value)||0,d=parseFloat(document.getElementById("salesTax").value)||0,c=parseFloat(document.getElementById("otherFees").value)||0,t=document.getElementById("includeFeesInLoan").checked,l=parseFloat(document.getElementById("extraMonthlyPayment").value)||0,i=parseInt(document.getElementById("startMonth").value),u=parseInt(document.getElementById("startYear").value);let E=state.downPaymentType==="percent"?e*(o/100):o;const T=n-r,h=Math.max(0,e-n)*(d/100),D=t?0:h+c;let m=e-E-T;t&&(m+=h+c),m<0&&(m=0);const g=a/100/12,f=s;let y;g===0?y=m/f:y=m*(g*Math.pow(1+g,f))/(Math.pow(1+g,f)-1);const I=[];let p=m,M=0,w=0;const F=new Date(u,i);for(let v=1;v<=f&&p>0;v++){const P=new Date(F);P.setMonth(P.getMonth()+v-1);const x=p*g;let B=y-x;const C=Math.min(B+l,p),b=Math.max(0,C-B);if(B=C-b,p-=C,M+=x,w+=y+b,I.push({month:v,date:new Date(P),payment:y+b,principal:B+b,interest:x,balance:Math.max(0,p),extraPayment:b}),p<=0)break}const k=w+E+T+(t?0:h+c),L=h+c;state.results={autoPrice:e,loanAmount:m,monthlyPayment:y,totalLoanPayment:w,totalInterest:M,salesTaxAmount:h,otherFees:c,totalTaxAndFees:L,downPayment:E,tradeInValue:n,payoffDate:I.length>0?I[I.length-1].date:F,schedule:I},renderResults()}function renderResults(){if(!state.results)return;document.getElementById("resultsPlaceholder").style.display="none",document.getElementById("resultsContent").style.display="block",document.getElementById("amortizationSection").style.display="block",document.getElementById("monthlyPaymentDisplay").textContent=formatCurrency(state.results.monthlyPayment);const e=state.results;let s=`
    <tr>
      <td class="muted">Auto Price</td>
      <td>${formatCurrency(e.autoPrice)}</td>
    </tr>
    <tr>
      <td class="muted">Sales Tax & Fees</td>
      <td>${formatCurrency(e.totalTaxAndFees)}</td>
    </tr>
    <tr>
      <td class="muted">Total Interest</td>
      <td>${formatCurrency(e.totalInterest)}</td>
    </tr>
    <tr class="total-row">
      <td>Total Loan Payments</td>
      <td>${formatCurrency(e.totalLoanPayment)}</td>
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
      <span class="stat-value">${formatCurrency(e.totalLoanPayment)}</span>
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
  `;document.getElementById("summaryStats").innerHTML=a,renderPieChart(),renderLineChart(),renderScheduleTable()}function renderPieChart(){const e=state.results,s=document.getElementById("pieChart").getContext("2d");state.pieChart&&state.pieChart.destroy();const a=[{label:"Loan Principal",value:e.loanAmount,color:"hsl(262, 83%, 58%)"},{label:"Total Interest",value:e.totalInterest,color:"hsl(38, 92%, 50%)"}];state.pieChart=new Chart(s,{type:"doughnut",data:{labels:a.map(n=>n.label),datasets:[{data:a.map(n=>n.value),backgroundColor:a.map(n=>n.color),borderWidth:0,hoverOffset:4}]},options:{responsive:!0,maintainAspectRatio:!1,cutout:"60%",plugins:{legend:{display:!1},tooltip:{callbacks:{label:function(n){const r=n.dataset.data.reduce((c,t)=>c+t,0),d=(n.raw/r*100).toFixed(0);return`${n.label}: ${formatCurrency(n.raw)} (${d}%)`}}}}}});const o=a.map(n=>`
    <div class="legend-item">
      <div class="legend-dot" style="background: ${n.color}"></div>
      <span>${n.label}</span>
    </div>
  `).join("");document.getElementById("chartLegend").innerHTML=o}function renderLineChart(){var c;const e=state.results,s=document.getElementById("lineChart").getContext("2d");state.lineChart&&state.lineChart.destroy();const a=[];let o=(c=e.schedule[0])==null?void 0:c.date.getFullYear(),n=0,r=0,d=1;e.schedule.forEach((t,l)=>{var u;const i=t.date.getFullYear();i!==o||l===e.schedule.length-1?(l===e.schedule.length-1&&(n+=t.interest,r+=t.principal),a.push({year:d,balance:l===e.schedule.length-1?t.balance:((u=e.schedule[l-1])==null?void 0:u.balance)||0,interest:n,principal:r}),d++,o=i,n=t.interest,r=t.principal):(n+=t.interest,r+=t.principal)}),state.lineChart=new Chart(s,{type:"line",data:{labels:a.map(t=>t.year),datasets:[{label:"Balance",data:a.map(t=>t.balance),borderColor:"hsl(262, 83%, 58%)",backgroundColor:"hsla(262, 83%, 58%, 0.1)",fill:!0,tension:.4},{label:"Interest",data:a.map(t=>t.interest),borderColor:"hsl(38, 92%, 50%)",backgroundColor:"hsla(38, 92%, 50%, 0.1)",fill:!0,tension:.4}]},options:{responsive:!0,maintainAspectRatio:!1,interaction:{intersect:!1,mode:"index"},plugins:{legend:{position:"top"},tooltip:{callbacks:{label:function(t){return`${t.dataset.label}: ${formatCurrency(t.raw)}`}}}},scales:{x:{title:{display:!0,text:"Year"},grid:{display:!1}},y:{title:{display:!1},ticks:{callback:function(t){return state.currency==="INR"?"\u20B9"+(t/1e3).toFixed(0)+"K":"$"+(t/1e3).toFixed(0)+"K"}},grid:{color:"hsl(210, 20%, 90%)"}}}}})}function renderScheduleTable(){var s;const e=state.results;if(state.scheduleView==="annual"){const a=[];let o=(s=e.schedule[0])==null?void 0:s.date.getFullYear(),n=0,r=0,d=e.loanAmount,c=1;e.schedule.forEach((l,i)=>{const u=l.date.getFullYear();u!==o||i===e.schedule.length-1?(i===e.schedule.length-1&&(n+=l.interest,r+=l.principal,d=l.balance),a.push({year:c,date:o,interest:n,principal:r,balance:i===e.schedule.length-1?l.balance:d}),c++,o=u,n=l.interest,r=l.principal,d=l.balance):(n+=l.interest,r+=l.principal,d=l.balance)});const t=a.map(l=>`
      <tr>
        <td>${l.year}</td>
        <td>${l.date}</td>
        <td>${formatCurrency(l.interest)}</td>
        <td>${formatCurrency(l.principal)}</td>
        <td>${formatCurrency(l.balance)}</td>
      </tr>
    `).join("");document.getElementById("scheduleTableBody").innerHTML=t}else{const a=e.schedule.map(o=>`
      <tr>
        <td>${o.month}</td>
        <td>${formatDate(o.date)}</td>
        <td>${formatCurrency(o.interest)}</td>
        <td>${formatCurrency(o.principal)}</td>
        <td>${formatCurrency(o.balance)}</td>
      </tr>
    `).join("");document.getElementById("scheduleTableBody").innerHTML=a}}function clearForm(){document.getElementById("autoPrice").value=35e3,document.getElementById("loanTerm").value=60,document.getElementById("interestRate").value=6.5,document.getElementById("downPayment").value=0,document.getElementById("tradeInValue").value=0,document.getElementById("tradeInOwed").value=0,document.getElementById("salesTax").value=0,document.getElementById("otherFees").value=0,document.getElementById("extraMonthlyPayment").value=0,setDownPaymentType("dollar"),document.getElementById("resultsContent").style.display="none",document.getElementById("resultsPlaceholder").style.display="flex",document.getElementById("amortizationSection").style.display="none"}function formatCurrency(e){return new Intl.NumberFormat(state.locale,{style:"currency",currency:state.currency,minimumFractionDigits:0,maximumFractionDigits:2}).format(e)}function formatDate(e){return e.toLocaleDateString("en-US",{month:"short",year:"numeric"})}
