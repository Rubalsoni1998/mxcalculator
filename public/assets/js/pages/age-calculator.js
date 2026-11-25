document.addEventListener("DOMContentLoaded",function(){const n=new Date;document.getElementById("targetDateInput").valueAsDate=n;const s=new Date("2000-01-01");document.getElementById("dobInput").valueAsDate=s});function calculate(){const n=document.getElementById("dobInput").value,s=document.getElementById("targetDateInput").value;if(!n||!s){alert("Please enter valid dates.");return}const a=new Date(n),t=new Date(s);if(a>t){alert("Date of Birth cannot be after the Target Date.");return}let l=t.getFullYear()-a.getFullYear(),e=t.getMonth()-a.getMonth(),o=t.getDate()-a.getDate();if(o<0){e--;const h=new Date(t.getFullYear(),t.getMonth(),0);o+=h.getDate()}e<0&&(l--,e+=12);const m=Math.abs(t-a),r=Math.floor(m/(1e3*60*60*24)),g=Math.floor(r/7),i=r%7,u=r*24,D=u*60,c=t.getFullYear();let d=new Date(a);d.setFullYear(c),d<t&&d.setFullYear(c+1);const y=Math.ceil((d-t)/(1e3*60*60*24)),I=d.toLocaleDateString("en-US",{weekday:"long"});document.getElementById("resultsPlaceholder").classList.add("hidden"),document.getElementById("resultsContent").classList.remove("hidden"),document.getElementById("ageDisplay").textContent=`${l} years ${e} months ${o} days`,document.getElementById("ageSubDisplay").textContent=`or ${l*12+e} months ${o} days`,l>0||e>0||o>0?(document.getElementById("nextBdayDate").textContent=d.toLocaleDateString("en-US",{weekday:"long",year:"numeric",month:"long",day:"numeric"}),y===0?document.getElementById("nextBdayCounter").textContent="Happy Birthday! It's today!":document.getElementById("nextBdayCounter").textContent=`${y} days remaining`):document.getElementById("nextBdayCounter").textContent="Born today!";const B=document.getElementById("breakdownBody");B.innerHTML=`
        <tr>
            <td>Total Months</td>
            <td>${l*12+e} months, ${o} days</td>
        </tr>
        <tr>
            <td>Total Weeks</td>
            <td>${g.toLocaleString("en-US")} weeks, ${i} days</td>
        </tr>
        <tr>
            <td>Total Days</td>
            <td>${r.toLocaleString("en-US")} days</td>
        </tr>
        <tr>
            <td>Total Hours (approx)</td>
            <td>${u.toLocaleString("en-US")} hours</td>
        </tr>
        <tr>
            <td>Total Minutes (approx)</td>
            <td>${D.toLocaleString("en-US")} minutes</td>
        </tr>
    `}function clearForm(){const n=new Date;document.getElementById("targetDateInput").valueAsDate=n,document.getElementById("dobInput").value="",document.getElementById("resultsContent").classList.add("hidden"),document.getElementById("resultsPlaceholder").classList.remove("hidden")}
