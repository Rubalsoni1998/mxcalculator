let state={unitSystem:"us"};document.addEventListener("DOMContentLoaded",function(){setUnits("us")});function setUnits(e){state.unitSystem=e,document.getElementById("tabUS").className=e==="us"?"tab-btn active":"tab-btn",document.getElementById("tabMetric").className=e==="metric"?"tab-btn active":"tab-btn";const n=document.getElementById("heightUS"),s=document.getElementById("heightMetric");e==="us"?(n.classList.remove("hidden"),s.classList.add("hidden")):(n.classList.add("hidden"),s.classList.remove("hidden"))}function calculate(){let e=0,n=0;const s=document.getElementById("gender").value,B=document.getElementById("age").value;if(state.unitSystem==="us"){const l=parseFloat(document.getElementById("heightFeet").value)||0,I=parseFloat(document.getElementById("heightInches").value)||0;n=l*12+I,e=n*.0254}else{const l=parseFloat(document.getElementById("heightCm").value)||0;e=l/100,n=l/2.54}if(e<=0){alert("Please enter a valid height.");return}const t=n-60;let i=0,a=0,o=0,c=0;s==="male"?(i=52+1.9*t,a=56.2+1.41*t,o=50+2.3*t,c=48.08+2.72*t):(i=49+1.7*t,a=53.1+1.36*t,o=45.5+2.3*t,c=45.35+2.26*t);const u=18.5*(e*e),g=25*(e*e),m=state.unitSystem==="us",h=m?2.20462:1,r=m?"lbs":"kgs",d=l=>(l*h).toFixed(1)+" "+r;document.getElementById("resultsPlaceholder").classList.add("hidden"),document.getElementById("resultsContent").classList.remove("hidden"),document.getElementById("idealWeightDisplay").textContent=d(i);const y=document.getElementById("formulaTableBody");y.innerHTML=`
        <tr>
            <td>Robinson Formula</td>
            <td>${d(i)}</td>
        </tr>
        <tr>
            <td>Miller Formula</td>
            <td>${d(a)}</td>
        </tr>
        <tr>
            <td>Devine Formula</td>
            <td>${d(o)}</td>
        </tr>
         <tr>
            <td>Hamwi Formula</td>
            <td>${d(c)}</td>
        </tr>
    `,document.getElementById("bmiRangeDisplay").textContent=`${d(u)} - ${d(g)}`}function clearForm(){state.unitSystem==="us"?(document.getElementById("heightFeet").value="",document.getElementById("heightInches").value=""):document.getElementById("heightCm").value="",document.getElementById("age").value=25,document.getElementById("resultsContent").classList.add("hidden"),document.getElementById("resultsPlaceholder").classList.remove("hidden")}
