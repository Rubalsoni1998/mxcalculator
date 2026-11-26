const mxCur=window.mxCurrency&&window.mxCurrency.get()||{code:"USD",locale:"en-US",symbol:"$"};let state={downPaymentType:"dollar",scheduleView:"annual",results:null,pieChart:null,lineChart:null,currency:mxCur.code,locale:mxCur.locale};document.addEventListener("DOMContentLoaded",function(){initializeYearSelects(),initializeDateSelects(),calculate()});function initializeYearSelects(){const e=new Date().getFullYear(),s=document.getElementById("startYear");for(let l=0;l<50;l++){const o=e+l;s.add(new Option(o,o))}}function initializeDateSelects(){const e=new Date;document.getElementById("startMonth").value=e.getMonth(),document.getElementById("startYear").value=e.getFullYear()}function applyCurrencySymbols(){mxCur.code!=="USD"&&document.querySelectorAll(".dynamic-symbol, .dynamic-symbol-btn").forEach(e=>{e.textContent=mxCur.symbol})}applyCurrencySymbols();function setDownPaymentType(e){state.downPaymentType=e,document.getElementById("downPaymentPercent").classList.toggle("active",e==="percent"),document.getElementById("downPaymentDollar").classList.toggle("active",e==="dollar")}function toggleMoreOptions(){const e=document.getElementById("moreOptionsBtn"),s=document.getElementById("moreOptionsContent");e.classList.toggle("open"),s.classList.toggle("open")}function setScheduleView(e){state.scheduleView=e,document.getElementById("annualTab").classList.toggle("active",e==="annual"),document.getElementById("monthlyTab").classList.toggle("active",e==="monthly"),document.getElementById("scheduleCol1").textContent=e==="annual"?"Year":"Month",renderScheduleTable()}function calculate(){const e=parseFloat(document.getElementById("autoPrice").value)||0,s=parseInt(document.getElementById("loanTerm").value)||60,l=parseFloat(document.getElementById("interestRate").value)||0,o=parseFloat(document.getElementById("downPayment").value)||0,t=parseFloat(document.getElementById("tradeInValue").value)||0,r=parseFloat(document.getElementById("tradeInOwed").value)||0,d=parseFloat(document.getElementById("salesTax").value)||0,c=parseFloat(document.getElementById("otherFees").value)||0,n=document.getElementById("includeFeesInLoan").checked,a=parseFloat(document.getElementById("extraMonthlyPayment").value)||0,i=parseInt(document.getElementById("startMonth").value),u=parseInt(document.getElementById("startYear").value);let w=state.downPaymentType==="percent"?e*(o/100):o;const T=t-r,g=Math.max(0,e-t)*(d/100),D=n?0:g+c;let m=e-w-T;n&&(m+=g+c),m<0&&(m=0);const h=l/100/12,f=s;let y;h===0?y=m/f:y=m*(h*Math.pow(1+h,f))/(Math.pow(1+h,f)-1);const I=[];let p=m,M=0,E=0;const F=new Date(u,i);for(let v=1;v<=f&&p>0;v++){const P=new Date(F);P.setMonth(P.getMonth()+v-1);const x=p*h;let B=y-x;const C=Math.min(B+a,p),b=Math.max(0,C-B);if(B=C-b,p-=C,M+=x,E+=y+b,I.push({month:v,date:new Date(P),payment:y+b,principal:B+b,interest:x,balance:Math.max(0,p),extraPayment:b}),p<=0)break}const k=E+w+T+(n?0:g+c),L=g+c;state.results={autoPrice:e,loanAmount:m,monthlyPayment:y,totalLoanPayment:E,totalInterest:M,salesTaxAmount:g,otherFees:c,totalTaxAndFees:L,downPayment:w,tradeInValue:t,payoffDate:I.length>0?I[I.length-1].date:F,schedule:I},renderResults()}function renderResults(){if(!state.results)return;document.getElementById("resultsPlaceholder").style.display="none",document.getElementById("resultsContent").style.display="block",document.getElementById("amortizationSection").style.display="block",document.getElementById("monthlyPaymentDisplay").textContent=formatCurrency(state.results.monthlyPayment);const e=state.results;let s=`
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
  `;document.getElementById("breakdownTableBody").innerHTML=s;const l=`
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
  `;document.getElementById("summaryStats").innerHTML=l,renderPieChart(),renderLineChart(),renderScheduleTable()}function renderPieChart(){const e=state.results,s=document.getElementById("pieChart").getContext("2d");state.pieChart&&state.pieChart.destroy();const l=[{label:"Loan Principal",value:e.loanAmount,color:"hsl(262, 83%, 58%)"},{label:"Total Interest",value:e.totalInterest,color:"hsl(38, 92%, 50%)"}];state.pieChart=new Chart(s,{type:"doughnut",data:{labels:l.map(t=>t.label),datasets:[{data:l.map(t=>t.value),backgroundColor:l.map(t=>t.color),borderWidth:0,hoverOffset:4}]},options:{responsive:!0,maintainAspectRatio:!1,cutout:"60%",plugins:{legend:{display:!1},tooltip:{callbacks:{label:function(t){const r=t.dataset.data.reduce((c,n)=>c+n,0),d=(t.raw/r*100).toFixed(0);return`${t.label}: ${formatCurrency(t.raw)} (${d}%)`}}}}}});const o=l.map(t=>`
    <div class="legend-item">
      <div class="legend-dot" style="background: ${t.color}"></div>
      <span>${t.label}</span>
    </div>
  `).join("");document.getElementById("chartLegend").innerHTML=o}function renderLineChart(){var c;const e=state.results,s=document.getElementById("lineChart").getContext("2d");state.lineChart&&state.lineChart.destroy();const l=[];let o=(c=e.schedule[0])==null?void 0:c.date.getFullYear(),t=0,r=0,d=1;e.schedule.forEach((n,a)=>{var u;const i=n.date.getFullYear();i!==o||a===e.schedule.length-1?(a===e.schedule.length-1&&(t+=n.interest,r+=n.principal),l.push({year:d,balance:a===e.schedule.length-1?n.balance:((u=e.schedule[a-1])==null?void 0:u.balance)||0,interest:t,principal:r}),d++,o=i,t=n.interest,r=n.principal):(t+=n.interest,r+=n.principal)}),state.lineChart=new Chart(s,{type:"line",data:{labels:l.map(n=>n.year),datasets:[{label:"Balance",data:l.map(n=>n.balance),borderColor:"hsl(262, 83%, 58%)",backgroundColor:"hsla(262, 83%, 58%, 0.1)",fill:!0,tension:.4},{label:"Interest",data:l.map(n=>n.interest),borderColor:"hsl(38, 92%, 50%)",backgroundColor:"hsla(38, 92%, 50%, 0.1)",fill:!0,tension:.4}]},options:{responsive:!0,maintainAspectRatio:!1,interaction:{intersect:!1,mode:"index"},plugins:{legend:{position:"top"},tooltip:{callbacks:{label:function(n){return`${n.dataset.label}: ${formatCurrency(n.raw)}`}}}},scales:{x:{title:{display:!0,text:"Year"},grid:{display:!1}},y:{title:{display:!1},ticks:{callback:function(n){return mxCur.symbol+(n/1e3).toFixed(0)+"K"}},grid:{color:"hsl(210, 20%, 90%)"}}}}})}function renderScheduleTable(){var s;const e=state.results;if(state.scheduleView==="annual"){const l=[];let o=(s=e.schedule[0])==null?void 0:s.date.getFullYear(),t=0,r=0,d=e.loanAmount,c=1;e.schedule.forEach((a,i)=>{const u=a.date.getFullYear();u!==o||i===e.schedule.length-1?(i===e.schedule.length-1&&(t+=a.interest,r+=a.principal,d=a.balance),l.push({year:c,date:o,interest:t,principal:r,balance:i===e.schedule.length-1?a.balance:d}),c++,o=u,t=a.interest,r=a.principal,d=a.balance):(t+=a.interest,r+=a.principal,d=a.balance)});const n=l.map(a=>`
      <tr>
        <td>${a.year}</td>
        <td>${a.date}</td>
        <td>${formatCurrency(a.interest)}</td>
        <td>${formatCurrency(a.principal)}</td>
        <td>${formatCurrency(a.balance)}</td>
      </tr>
    `).join("");document.getElementById("scheduleTableBody").innerHTML=n}else{const l=e.schedule.map(o=>`
      <tr>
        <td>${o.month}</td>
        <td>${formatDate(o.date)}</td>
        <td>${formatCurrency(o.interest)}</td>
        <td>${formatCurrency(o.principal)}</td>
        <td>${formatCurrency(o.balance)}</td>
      </tr>
    `).join("");document.getElementById("scheduleTableBody").innerHTML=l}}function clearForm(){document.getElementById("autoPrice").value=35e3,document.getElementById("loanTerm").value=60,document.getElementById("interestRate").value=6.5,document.getElementById("downPayment").value=0,document.getElementById("tradeInValue").value=0,document.getElementById("tradeInOwed").value=0,document.getElementById("salesTax").value=0,document.getElementById("otherFees").value=0,document.getElementById("extraMonthlyPayment").value=0,setDownPaymentType("dollar"),document.getElementById("resultsContent").style.display="none",document.getElementById("resultsPlaceholder").style.display="flex",document.getElementById("amortizationSection").style.display="none"}function formatCurrency(e){return new Intl.NumberFormat(state.locale,{style:"currency",currency:state.currency,minimumFractionDigits:0,maximumFractionDigits:2}).format(e)}function formatDate(e){return e.toLocaleDateString("en-US",{month:"short",year:"numeric"})}
