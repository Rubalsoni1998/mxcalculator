let state={currency:"USD",locale:"en-US",pieChart:null};document.addEventListener("DOMContentLoaded",function(){calculate()});function setCurrency(t){state.currency=t,state.locale=t==="INR"?"en-IN":"en-US";const n=t==="INR"?"\u20B9":"$";document.querySelectorAll(".dynamic-symbol").forEach(a=>{a.textContent=n}),calculate()}function calculate(){const t=parseFloat(document.getElementById("beforeTaxPrice").value)||0,n=parseFloat(document.getElementById("taxRate").value)||0,a=t*(n/100),e=t+a;state.results={price:t,taxAmount:a,totalPrice:e,rate:n},renderResults()}function renderResults(){if(!state.results)return;document.getElementById("resultsPlaceholder").style.display="none",document.getElementById("resultsContent").style.display="block";const t=state.results;document.getElementById("resultValueDisplay").textContent=formatCurrency(t.totalPrice);const n=document.getElementById("breakdownTableBody");n.innerHTML=`
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
  `,renderPieChart()}function renderPieChart(){const t=state.results,n=document.getElementById("pieChart").getContext("2d");state.pieChart&&state.pieChart.destroy();const a=[{label:"Base Price",value:t.price,color:"hsl(180, 60%, 80%)"},{label:"Tax",value:t.taxAmount,color:"hsl(180, 100%, 30%)"}];state.pieChart=new Chart(n,{type:"doughnut",data:{labels:a.map(e=>e.label),datasets:[{data:a.map(e=>e.value),backgroundColor:a.map(e=>e.color),borderWidth:0,hoverOffset:4}]},options:{responsive:!0,maintainAspectRatio:!1,cutout:"60%",plugins:{legend:{display:!0,position:"bottom"},tooltip:{callbacks:{label:function(e){const l=e.dataset.data.reduce((o,c)=>o+c,0),r=(e.raw/l*100).toFixed(1);return`${e.label}: ${formatCurrency(e.raw)} (${r}%)`}}}}}})}function clearForm(){document.getElementById("beforeTaxPrice").value="",document.getElementById("taxRate").value="",document.getElementById("resultsContent").style.display="none",document.getElementById("resultsPlaceholder").style.display="flex"}function formatCurrency(t){return isNaN(t)?"Error":new Intl.NumberFormat(state.locale,{style:"currency",currency:state.currency,minimumFractionDigits:2,maximumFractionDigits:2}).format(t)}
