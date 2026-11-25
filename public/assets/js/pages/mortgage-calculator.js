let state={downPaymentType:"percent",propertyTaxType:"percent",homeInsuranceType:"dollar",pmiType:"dollar",hoaType:"dollar",otherCostsType:"dollar",scheduleView:"annual",results:null,pieChart:null,lineChart:null,currency:"USD",locale:"en-US"};document.addEventListener("DOMContentLoaded",function(){initializeYearSelects(),initializeDateSelects(),document.getElementById("includeTaxes").addEventListener("change",toggleTaxesSection),calculate()});function initializeYearSelects(){const e=new Date().getFullYear(),s=document.getElementById("startYear"),t=document.getElementById("extraOneTimeYear");for(let l=0;l<50;l++){const r=e+l;s.add(new Option(r,r)),t.add(new Option(r,r))}t.value=e+1}function initializeDateSelects(){const e=new Date;document.getElementById("startMonth").value=e.getMonth(),document.getElementById("startYear").value=e.getFullYear()}function setCurrency(e){state.currency=e,state.locale=e==="INR"?"en-IN":"en-US";const s=e==="INR"?"\u20B9":"$";document.querySelectorAll(".dynamic-symbol").forEach(t=>{t.textContent=s}),document.querySelectorAll(".dynamic-symbol-btn").forEach(t=>{t.textContent=s}),calculate()}function setDownPaymentType(e){state.downPaymentType=e,document.getElementById("downPaymentPercent").classList.toggle("active",e==="percent"),document.getElementById("downPaymentDollar").classList.toggle("active",e==="dollar")}function setPropertyTaxType(e){state.propertyTaxType=e,document.getElementById("propertyTaxPercent").classList.toggle("active",e==="percent"),document.getElementById("propertyTaxDollar").classList.toggle("active",e==="dollar")}function setHomeInsuranceType(e){state.homeInsuranceType=e,document.getElementById("homeInsurancePercent").classList.toggle("active",e==="percent"),document.getElementById("homeInsuranceDollar").classList.toggle("active",e==="dollar")}function setPmiType(e){state.pmiType=e,document.getElementById("pmiInsurancePercent").classList.toggle("active",e==="percent"),document.getElementById("pmiInsuranceDollar").classList.toggle("active",e==="dollar")}function setHoaType(e){state.hoaType=e,document.getElementById("hoaFeePercent").classList.toggle("active",e==="percent"),document.getElementById("hoaFeeDollar").classList.toggle("active",e==="dollar")}function setOtherCostsType(e){state.otherCostsType=e,document.getElementById("otherCostsPercent").classList.toggle("active",e==="percent"),document.getElementById("otherCostsDollar").classList.toggle("active",e==="dollar")}function toggleTaxesSection(){const e=document.getElementById("taxesSection"),s=document.getElementById("includeTaxes");e.classList.toggle("hidden",!s.checked)}function toggleMoreOptions(){const e=document.getElementById("moreOptionsBtn"),s=document.getElementById("moreOptionsContent");e.classList.toggle("open"),s.classList.toggle("open")}function setScheduleView(e){state.scheduleView=e,document.getElementById("annualTab").classList.toggle("active",e==="annual"),document.getElementById("monthlyTab").classList.toggle("active",e==="monthly"),document.getElementById("scheduleCol1").textContent=e==="annual"?"Year":"Month",renderScheduleTable()}function calculate(){const e=parseFloat(document.getElementById("homePrice").value)||0,s=parseFloat(document.getElementById("downPayment").value)||0,t=parseInt(document.getElementById("loanTerm").value)||30,l=parseFloat(document.getElementById("interestRate").value)||0,r=parseInt(document.getElementById("startMonth").value),o=parseInt(document.getElementById("startYear").value),d=document.getElementById("includeTaxes").checked,i=state.downPaymentType==="percent"?e*(s/100):s,n=e-i,a=l/100/12,m=t*12;let c;a===0?c=n/m:c=n*(a*Math.pow(1+a,m))/(Math.pow(1+a,m)-1);let f=0,B=0,P=0,E=0,b=0;if(d){const y=parseFloat(document.getElementById("propertyTax").value)||0;f=state.propertyTaxType==="percent"?e*(y/100)/12:y/12;const u=parseFloat(document.getElementById("homeInsurance").value)||0;B=state.homeInsuranceType==="percent"?e*(u/100)/12:u/12;const I=parseFloat(document.getElementById("pmiInsurance").value)||0;P=state.pmiType==="percent"?n*(I/100)/12:I/12;const p=parseFloat(document.getElementById("hoaFee").value)||0;E=state.hoaType==="percent"?e*(p/100)/12:p/12;const v=parseFloat(document.getElementById("otherCosts").value)||0;b=state.otherCostsType==="percent"?e*(v/100)/12:v/12}const $=parseFloat(document.getElementById("extraMonthlyPayment").value)||0,L=parseFloat(document.getElementById("extraYearlyPayment").value)||0,D=parseInt(document.getElementById("extraYearlyMonth").value),F=parseFloat(document.getElementById("extraOneTimePayment").value)||0,O=parseInt(document.getElementById("extraOneTimeMonth").value),Y=parseInt(document.getElementById("extraOneTimeYear").value),h=[];let g=n,w=0,x=0;const M=new Date(o,r);for(let y=1;y<=m&&g>0;y++){const u=new Date(M);u.setMonth(u.getMonth()+y-1);const I=g*a;let p=c-I,v=$;u.getMonth()===D&&(v+=L),u.getMonth()===O&&u.getFullYear()===Y&&(v+=F);const C=Math.min(p+v,g),T=Math.max(0,C-p);if(p=C-T,g-=C,w+=I,x+=c+T,h.push({month:y,date:new Date(u),payment:c+T,principal:p+T,interest:I,balance:Math.max(0,g),extraPayment:T}),g<=0)break}const k=c+f+B+P+E+b,H=(f+B+P+E+b)*h.length,S=x+H+i;state.results={homePrice:e,loanAmount:n,downPayment:i,monthlyPayment:c,monthlyPropertyTax:f,monthlyHomeInsurance:B,monthlyPMI:P,monthlyHOA:E,monthlyOtherCosts:b,totalMonthlyPayment:k,totalMortgagePayment:x,totalInterest:w,totalOutOfPocket:S,schedule:h,payoffDate:h.length>0?h[h.length-1].date:M},renderResults()}function renderResults(){if(!state.results)return;document.getElementById("resultsPlaceholder").style.display="none",document.getElementById("resultsContent").style.display="block",document.getElementById("amortizationSection").style.display="block",document.getElementById("monthlyPaymentDisplay").textContent=formatCurrency(state.results.totalMonthlyPayment);const e=state.results,s=e.schedule.length;let t=`
    <tr class="highlight">
      <td>Mortgage Payment</td>
      <td>${formatCurrency(e.monthlyPayment)}</td>
      <td>${formatCurrency(e.totalMortgagePayment)}</td>
    </tr>
  `;e.monthlyPropertyTax>0&&(t+=`
      <tr>
        <td class="muted">Property Tax</td>
        <td>${formatCurrency(e.monthlyPropertyTax)}</td>
        <td>${formatCurrency(e.monthlyPropertyTax*s)}</td>
      </tr>
    `),e.monthlyHomeInsurance>0&&(t+=`
      <tr>
        <td class="muted">Home Insurance</td>
        <td>${formatCurrency(e.monthlyHomeInsurance)}</td>
        <td>${formatCurrency(e.monthlyHomeInsurance*s)}</td>
      </tr>
    `);const l=e.monthlyPMI+e.monthlyHOA+e.monthlyOtherCosts;l>0&&(t+=`
      <tr>
        <td class="muted">Other Costs</td>
        <td>${formatCurrency(l)}</td>
        <td>${formatCurrency(l*s)}</td>
      </tr>
    `),t+=`
    <tr class="total-row">
      <td>Total Out-of-Pocket</td>
      <td>${formatCurrency(e.totalMonthlyPayment)}</td>
      <td>${formatCurrency(e.totalOutOfPocket)}</td>
    </tr>
  `,document.getElementById("breakdownTableBody").innerHTML=t;const r=`
    <div class="stat-row">
      <span class="stat-label">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
          <polyline points="9 22 9 12 15 12 15 22"></polyline>
        </svg>
        House Price
      </span>
      <span class="stat-value">${formatCurrency(e.homePrice)}</span>
    </div>
    <div class="stat-row">
      <span class="stat-label muted">Loan Amount</span>
      <span class="stat-value">${formatCurrency(e.loanAmount)}</span>
    </div>
    <div class="stat-row">
      <span class="stat-label muted">Down Payment</span>
      <span class="stat-value">${formatCurrency(e.downPayment)}</span>
    </div>
    <div class="stat-row">
      <span class="stat-label muted">Total of ${e.schedule.length} Payments</span>
      <span class="stat-value">${formatCurrency(e.totalMortgagePayment)}</span>
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
  `;document.getElementById("summaryStats").innerHTML=r,renderPieChart(),renderLineChart(),renderScheduleTable()}function renderPieChart(){const e=state.results,s=document.getElementById("pieChart").getContext("2d");state.pieChart&&state.pieChart.destroy();const t=[{label:"Principal & Interest",value:e.monthlyPayment,color:"hsl(168, 80%, 28%)"}];e.monthlyPropertyTax>0&&t.push({label:"Property Tax",value:e.monthlyPropertyTax,color:"hsl(160, 84%, 39%)"}),e.monthlyHomeInsurance>0&&t.push({label:"Home Insurance",value:e.monthlyHomeInsurance,color:"hsl(38, 92%, 50%)"});const l=e.monthlyPMI+e.monthlyHOA+e.monthlyOtherCosts;l>0&&t.push({label:"Other Costs",value:l,color:"hsl(350, 89%, 60%)"}),state.pieChart=new Chart(s,{type:"doughnut",data:{labels:t.map(o=>o.label),datasets:[{data:t.map(o=>o.value),backgroundColor:t.map(o=>o.color),borderWidth:0,hoverOffset:4}]},options:{responsive:!0,maintainAspectRatio:!1,cutout:"60%",plugins:{legend:{display:!1},tooltip:{callbacks:{label:function(o){const d=o.dataset.data.reduce((n,a)=>n+a,0),i=(o.raw/d*100).toFixed(0);return`${o.label}: ${formatCurrency(o.raw)} (${i}%)`}}}}}});const r=t.map(o=>`
    <div class="legend-item">
      <div class="legend-dot" style="background: ${o.color}"></div>
      <span>${o.label}</span>
    </div>
  `).join("");document.getElementById("chartLegend").innerHTML=r}function renderLineChart(){var i;const e=state.results,s=document.getElementById("lineChart").getContext("2d");state.lineChart&&state.lineChart.destroy();const t=[];let l=(i=e.schedule[0])==null?void 0:i.date.getFullYear(),r=0,o=0,d=1;e.schedule.forEach((n,a)=>{var c;const m=n.date.getFullYear();m!==l||a===e.schedule.length-1?(a===e.schedule.length-1&&(r+=n.interest,o+=n.principal),t.push({year:d,balance:a===e.schedule.length-1?n.balance:((c=e.schedule[a-1])==null?void 0:c.balance)||0,interest:r,principal:o}),d++,l=m,r=n.interest,o=n.principal):(r+=n.interest,o+=n.principal)}),state.lineChart=new Chart(s,{type:"line",data:{labels:t.map(n=>n.year),datasets:[{label:"Balance",data:t.map(n=>n.balance),borderColor:"hsl(168, 80%, 28%)",backgroundColor:"hsla(168, 80%, 28%, 0.1)",fill:!0,tension:.4},{label:"Interest",data:t.map(n=>n.interest),borderColor:"hsl(350, 89%, 60%)",backgroundColor:"hsla(350, 89%, 60%, 0.1)",fill:!0,tension:.4},{label:"Principal",data:t.map(n=>n.principal),borderColor:"hsl(160, 84%, 39%)",backgroundColor:"hsla(160, 84%, 39%, 0.1)",fill:!0,tension:.4}]},options:{responsive:!0,maintainAspectRatio:!1,interaction:{intersect:!1,mode:"index"},plugins:{legend:{position:"top"},tooltip:{callbacks:{label:function(n){return`${n.dataset.label}: ${formatCurrency(n.raw)}`}}}},scales:{x:{title:{display:!0,text:"Year"},grid:{display:!1}},y:{title:{display:!1},ticks:{callback:function(n){return state.currency==="INR"?"\u20B9"+(n/1e3).toFixed(0)+"K":"$"+(n/1e3).toFixed(0)+"K"}},grid:{color:"hsl(210, 20%, 90%)"}}}}})}function renderScheduleTable(){var s;const e=state.results;if(state.scheduleView==="annual"){const t=[];let l=(s=e.schedule[0])==null?void 0:s.date.getFullYear(),r=0,o=0,d=e.loanAmount,i=1;e.schedule.forEach((a,m)=>{const c=a.date.getFullYear();c!==l||m===e.schedule.length-1?(m===e.schedule.length-1&&(r+=a.interest,o+=a.principal,d=a.balance),t.push({year:i,date:l,interest:r,principal:o,balance:m===e.schedule.length-1?a.balance:d}),i++,l=c,r=a.interest,o=a.principal,d=a.balance):(r+=a.interest,o+=a.principal,d=a.balance)});const n=t.map(a=>`
      <tr>
        <td>${a.year}</td>
        <td>${a.date}</td>
        <td>${formatCurrency(a.interest)}</td>
        <td>${formatCurrency(a.principal)}</td>
        <td>${formatCurrency(a.balance)}</td>
      </tr>
    `).join("");document.getElementById("scheduleTableBody").innerHTML=n}else{const t=e.schedule.map(l=>`
      <tr>
        <td>${l.month}</td>
        <td>${formatDate(l.date)}</td>
        <td>${formatCurrency(l.interest)}</td>
        <td>${formatCurrency(l.principal)}</td>
        <td>${formatCurrency(l.balance)}</td>
      </tr>
    `).join("");document.getElementById("scheduleTableBody").innerHTML=t}}function clearForm(){document.getElementById("homePrice").value=4e5,document.getElementById("downPayment").value=20,document.getElementById("loanTerm").value=30,document.getElementById("interestRate").value=6.197,document.getElementById("propertyTax").value=1.2,document.getElementById("homeInsurance").value=1500,document.getElementById("pmiInsurance").value=0,document.getElementById("hoaFee").value=0,document.getElementById("otherCosts").value=4e3,document.getElementById("extraMonthlyPayment").value=0,document.getElementById("extraYearlyPayment").value=0,document.getElementById("extraOneTimePayment").value=0,setDownPaymentType("percent"),setPropertyTaxType("percent"),setHomeInsuranceType("dollar"),setPmiType("dollar"),setHoaType("dollar"),setOtherCostsType("dollar"),document.getElementById("resultsContent").style.display="none",document.getElementById("resultsPlaceholder").style.display="flex",document.getElementById("amortizationSection").style.display="none"}function formatCurrency(e){return new Intl.NumberFormat(state.locale,{style:"currency",currency:state.currency,minimumFractionDigits:0,maximumFractionDigits:2}).format(e)}function formatDate(e){return e.toLocaleDateString("en-US",{month:"short",year:"numeric"})}
