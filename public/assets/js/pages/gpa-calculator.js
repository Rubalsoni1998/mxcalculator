const gradePoints={"A+":4.3,A:4,"A-":3.7,"B+":3.3,B:3,"B-":2.7,"C+":2.3,C:2,"C-":1.7,"D+":1.3,D:1,"D-":.7,F:0};document.addEventListener("DOMContentLoaded",function(){for(let t=0;t<5;t++)addCourseRow()});function addCourseRow(){const t=document.getElementById("courseList"),e=document.createElement("div");e.className="course-row",e.innerHTML=`
        <input type="text" class="course-name" placeholder="Course ${t.children.length+1}">
        <select class="course-grade">
            <option value="">--</option>
            <option value="A+">A+</option>
            <option value="A" selected>A</option>
            <option value="A-">A-</option>
            <option value="B+">B+</option>
            <option value="B">B</option>
            <option value="B-">B-</option>
            <option value="C+">C+</option>
            <option value="C">C</option>
            <option value="C-">C-</option>
            <option value="D+">D+</option>
            <option value="D">D</option>
            <option value="D-">D-</option>
            <option value="F">F</option>
        </select>
        <input type="number" class="course-credits" value="3" min="0" max="10">
        <button type="button" class="remove-btn" onclick="this.parentElement.remove()" title="Remove">\xD7</button>
    `,t.appendChild(e)}function calculate(){const t=document.querySelectorAll(".course-row");let e=0,o=0;if(t.forEach(r=>{const l=r.querySelector(".course-grade").value,s=parseFloat(r.querySelector(".course-credits").value)||0;l&&s>0&&gradePoints.hasOwnProperty(l)&&(e+=gradePoints[l]*s,o+=s)}),o===0){alert("Please enter at least one course with valid credits and grade.");return}const a=e/o;document.getElementById("resultsPlaceholder").classList.add("hidden"),document.getElementById("resultsContent").classList.remove("hidden"),document.getElementById("gpaDisplay").textContent=a.toFixed(2),document.getElementById("totalCreditsDisplay").textContent=`Based on ${o} credits`,document.getElementById("totalPointsDisplay").textContent=e.toFixed(1),document.getElementById("totalCreditsTable").textContent=o;let n=a/4*100;n>100&&(n=100),document.getElementById("gpaMarker").style.left=n+"%"}function clearForm(){document.querySelectorAll(".course-row").forEach(e=>{e.querySelector(".course-name").value="",e.querySelector(".course-grade").value="",e.querySelector(".course-credits").value="3"}),document.getElementById("resultsContent").classList.add("hidden"),document.getElementById("resultsPlaceholder").classList.remove("hidden")}
