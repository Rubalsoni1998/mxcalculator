let state={currency:"USD",locale:"en-US",pieChart:null};document.addEventListener("DOMContentLoaded",function(){calculate()});function calculate(){const t=parseFloat(document.getElementById("beforeTaxPrice").value)||0,a=parseFloat(document.getElementById("taxRate").value)||0,r=t*(a/100),e=t+r;state.results={price:t,taxAmount:r,totalPrice:e,rate:a},renderResults()}function renderResults(){if(!state.results)return;document.getElementById("resultsPlaceholder").style.display="none",document.getElementById("resultsContent").style.display="block";const t=state.results;document.getElementById("resultValueDisplay").textContent=formatCurrency(t.totalPrice);const a=document.getElementById("breakdownTableBody");a.innerHTML=`
    <tr>
        <td class="muted">Before Tax Price</td>
        <td>${formatCurrency(t.price)}</td>
    </tr>
     <tr>
        <td class="muted">Sales Tax (${t.rate}%)</td>
        <td>${formatCurrency(t.taxAmount)}</td>
    </tr>
     <tr class="total-row">
        <td>Total Price</td>
        <td>${formatCurrency(t.totalPrice)}</td>
    </tr>
  `,renderPieChart()}function renderPieChart(){const t=state.results,a=document.getElementById("pieChart").getContext("2d");state.pieChart&&state.pieChart.destroy();const r=[{label:"Base Price",value:t.price,color:"hsl(180, 60%, 80%)"},{label:"Tax",value:t.taxAmount,color:"hsl(180, 100%, 30%)"}];state.pieChart=new Chart(a,{type:"doughnut",data:{labels:r.map(e=>e.label),datasets:[{data:r.map(e=>e.value),backgroundColor:r.map(e=>e.color),borderWidth:0,hoverOffset:4}]},options:{responsive:!0,maintainAspectRatio:!1,cutout:"60%",plugins:{legend:{display:!0,position:"bottom"},tooltip:{callbacks:{label:function(e){const n=e.dataset.data.reduce((o,s)=>o+s,0),l=(e.raw/n*100).toFixed(1);return`${e.label}: ${formatCurrency(e.raw)} (${l}%)`}}}}}})}function clearForm(){document.getElementById("beforeTaxPrice").value="",document.getElementById("taxRate").value="",document.getElementById("resultsContent").style.display="none",document.getElementById("resultsPlaceholder").style.display="flex"}function formatCurrency(t){return isNaN(t)?"Error":new Intl.NumberFormat(state.locale,{style:"currency",currency:state.currency,minimumFractionDigits:2,maximumFractionDigits:2}).format(t)}
