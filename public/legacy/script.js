// ===== CALCULATOR DEFINITIONS =====
const calculators = {
    mortgage: {
        title: 'Mortgage Calculator',
        inputs: [
            { label: 'Loan Amount ($)', id: 'loanAmount', type: 'number', placeholder: '300000' },
            { label: 'Annual Interest Rate (%)', id: 'interestRate', type: 'number', placeholder: '6.5', step: '0.01' },
            { label: 'Loan Term (Years)', id: 'loanTerm', type: 'number', placeholder: '30' }
        ],
        calculate: function(inputs) {
            const principal = parseFloat(inputs.loanAmount);
            const annualRate = parseFloat(inputs.interestRate) / 100 / 12;
            const numPayments = parseFloat(inputs.loanTerm) * 12;
            
            if (principal <= 0 || annualRate < 0 || numPayments <= 0) {
                return { error: 'Please enter valid numbers' };
            }
            
            const monthlyPayment = principal * (annualRate * Math.pow(1 + annualRate, numPayments)) / (Math.pow(1 + annualRate, numPayments) - 1);
            const totalPayment = monthlyPayment * numPayments;
            const totalInterest = totalPayment - principal;
            
            return {
                'Monthly Payment': '$' + monthlyPayment.toFixed(2),
                'Total Payment': '$' + totalPayment.toFixed(2),
                'Total Interest': '$' + totalInterest.toFixed(2)
            };
        }
    },

    bmi: {
        title: 'BMI Calculator',
        inputs: [
            { label: 'Height (cm)', id: 'height', type: 'number', placeholder: '180' },
            { label: 'Weight (kg)', id: 'weight', type: 'number', placeholder: '75' }
        ],
        calculate: function(inputs) {
            const height = parseFloat(inputs.height) / 100;
            const weight = parseFloat(inputs.weight);
            
            if (height <= 0 || weight <= 0) {
                return { error: 'Please enter valid numbers' };
            }
            
            const bmi = (weight / (height * height)).toFixed(1);
            let status = '';
            
            if (bmi < 18.5) status = 'Underweight';
            else if (bmi < 25) status = 'Normal Weight';
            else if (bmi < 30) status = 'Overweight';
            else status = 'Obese';
            
            return { 'BMI': bmi, 'Status': status };
        }
    },

    age: {
        title: 'Age Calculator',
        inputs: [
            { label: 'Birth Date', id: 'birthDate', type: 'date' }
        ],
        calculate: function(inputs) {
            const birthDate = new Date(inputs.birthDate);
            const today = new Date();
            
            if (birthDate > today) {
                return { error: 'Birth date cannot be in the future' };
            }
            
            let age = today.getFullYear() - birthDate.getFullYear();
            const monthDiff = today.getMonth() - birthDate.getMonth();
            
            if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
                age--;
            }
            
            return { 'Your Age': age + ' years old' };
        }
    },

    percentage: {
        title: 'Percentage Calculator',
        inputs: [
            { label: 'Number', id: 'number', type: 'number', placeholder: '100' },
            { label: 'Percentage (%)', id: 'percentage', type: 'number', placeholder: '15', step: '0.01' }
        ],
        calculate: function(inputs) {
            const number = parseFloat(inputs.number);
            const percentage = parseFloat(inputs.percentage);
            
            if (isNaN(number) || isNaN(percentage)) {
                return { error: 'Please enter valid numbers' };
            }
            
            const result = (number * percentage / 100).toFixed(2);
            return { 'Result': result };
        }
    },

    temperature: {
        title: 'Temperature Converter',
        inputs: [
            { label: 'Celsius', id: 'celsius', type: 'number', placeholder: '25' }
        ],
        calculate: function(inputs) {
            const celsius = parseFloat(inputs.celsius);
            
            if (isNaN(celsius)) {
                return { error: 'Please enter a valid number' };
            }
            
            const fahrenheit = (celsius * 9/5 + 32).toFixed(2);
            const kelvin = (celsius + 273.15).toFixed(2);
            
            return { 'Fahrenheit': fahrenheit + '°F', 'Kelvin': kelvin + 'K' };
        }
    },

    interest: {
        title: 'Interest Calculator',
        inputs: [
            { label: 'Principal Amount ($)', id: 'principal', type: 'number', placeholder: '10000' },
            { label: 'Annual Interest Rate (%)', id: 'rate', type: 'number', placeholder: '5', step: '0.01' },
            { label: 'Time (Years)', id: 'time', type: 'number', placeholder: '2' }
        ],
        calculate: function(inputs) {
            const principal = parseFloat(inputs.principal);
            const rate = parseFloat(inputs.rate);
            const time = parseFloat(inputs.time);
            
            if (principal <= 0 || rate < 0 || time <= 0) {
                return { error: 'Please enter valid numbers' };
            }
            
            const simpleInterest = (principal * rate * time / 100).toFixed(2);
            const totalAmount = (parseFloat(principal) + parseFloat(simpleInterest)).toFixed(2);
            
            return { 'Simple Interest': '$' + simpleInterest, 'Total Amount': '$' + totalAmount };
        }
    },

    investment: {
        title: 'Investment Calculator',
        inputs: [
            { label: 'Initial Investment ($)', id: 'investment', type: 'number', placeholder: '10000' },
            { label: 'Annual Return Rate (%)', id: 'returnRate', type: 'number', placeholder: '7', step: '0.1' },
            { label: 'Years', id: 'years', type: 'number', placeholder: '10' }
        ],
        calculate: function(inputs) {
            const investment = parseFloat(inputs.investment);
            const returnRate = parseFloat(inputs.returnRate) / 100;
            const years = parseFloat(inputs.years);
            
            if (investment <= 0 || returnRate < 0 || years <= 0) {
                return { error: 'Please enter valid numbers' };
            }
            
            const finalAmount = (investment * Math.pow(1 + returnRate, years)).toFixed(2);
            const gain = (finalAmount - investment).toFixed(2);
            
            return { 'Final Amount': '$' + finalAmount, 'Total Gain': '$' + gain };
        }
    },

    loan: {
        title: 'Loan Calculator',
        inputs: [
            { label: 'Loan Amount ($)', id: 'loanAmount', type: 'number', placeholder: '50000' },
            { label: 'Annual Interest Rate (%)', id: 'interestRate', type: 'number', placeholder: '5.5', step: '0.01' },
            { label: 'Loan Term (Years)', id: 'loanTerm', type: 'number', placeholder: '5' }
        ],
        calculate: function(inputs) {
            const principal = parseFloat(inputs.loanAmount);
            const annualRate = parseFloat(inputs.interestRate) / 100 / 12;
            const numPayments = parseFloat(inputs.loanTerm) * 12;
            
            if (principal <= 0 || annualRate < 0 || numPayments <= 0) {
                return { error: 'Please enter valid numbers' };
            }
            
            const monthlyPayment = principal * (annualRate * Math.pow(1 + annualRate, numPayments)) / (Math.pow(1 + annualRate, numPayments) - 1);
            const totalPayment = monthlyPayment * numPayments;
            const totalInterest = totalPayment - principal;
            
            return {
                'Monthly Payment': '$' + monthlyPayment.toFixed(2),
                'Total Payment': '$' + totalPayment.toFixed(2),
                'Total Interest': '$' + totalInterest.toFixed(2)
            };
        }
    },

    calorie: {
        title: 'Calorie Calculator',
        inputs: [
            { label: 'Weight (kg)', id: 'weight', type: 'number', placeholder: '75' },
            { label: 'Height (cm)', id: 'height', type: 'number', placeholder: '180' },
            { label: 'Age (years)', id: 'age', type: 'number', placeholder: '30' },
            { label: 'Gender', id: 'gender', type: 'select', options: ['Male', 'Female'] },
            { label: 'Activity Level', id: 'activity', type: 'select', options: ['Sedentary', 'Lightly Active', 'Moderately Active', 'Very Active'] }
        ],
        calculate: function(inputs) {
            const weight = parseFloat(inputs.weight);
            const height = parseFloat(inputs.height);
            const age = parseFloat(inputs.age);
            const gender = inputs.gender;
            
            if (weight <= 0 || height <= 0 || age <= 0) {
                return { error: 'Please enter valid numbers' };
            }
            
            let bmr;
            if (gender === 'Male') {
                bmr = 88.362 + (13.397 * weight) + (4.799 * height) - (5.677 * age);
            } else {
                bmr = 447.593 + (9.247 * weight) + (3.098 * height) - (4.330 * age);
            }
            
            const activityMultipliers = {
                'Sedentary': 1.2,
                'Lightly Active': 1.375,
                'Moderately Active': 1.55,
                'Very Active': 1.725
            };
            
            const tdee = (bmr * (activityMultipliers[inputs.activity] || 1.55)).toFixed(0);
            
            return { 'Daily Calorie Needs': tdee + ' calories' };
        }
    }
};

// ===== OPEN CALCULATOR MODAL =====
function openCalculator(type) {
    const calc = calculators[type];
    if (!calc) return;

    const modal = document.getElementById('calculatorModal');
    document.getElementById('calcTitle').textContent = calc.title;
    
    let html = '<div class="calculator-form">';
    
    calc.inputs.forEach(input => {
        html += `<div class="form-group">
            <label for="${input.id}">${input.label}</label>`;
        
        if (input.type === 'select') {
            html += `<select id="${input.id}">`;
            input.options.forEach(opt => {
                html += `<option value="${opt}">${opt}</option>`;
            });
            html += `</select>`;
        } else {
            html += `<input 
                type="${input.type}" 
                id="${input.id}" 
                placeholder="${input.placeholder || ''}"
                ${input.step ? `step="${input.step}"` : ''}
            >`;
        }
        
        html += `</div>`;
    });
    
    html += `
        <button class="btn-calculate" onclick="calculateResult('${type}')">Calculate</button>
        <div id="resultDisplay" class="result-display"></div>
    </div>
    `;
    
    document.getElementById('calculatorContent').innerHTML = html;
    modal.classList.add('active');
}

// ===== CALCULATE RESULT =====
function calculateResult(type) {
    const calc = calculators[type];
    const inputs = {};
    
    calc.inputs.forEach(input => {
        inputs[input.id] = document.getElementById(input.id).value;
    });
    
    const result = calc.calculate(inputs);
    const resultDisplay = document.getElementById('resultDisplay');
    
    if (result.error) {
        resultDisplay.innerHTML = `<p style="color: red; font-weight: bold;">${result.error}</p>`;
    } else {
        let html = '<p style="font-weight: bold; color: #667eea; margin-bottom: 10px;">✓ Result:</p>';
        Object.entries(result).forEach(([key, value]) => {
            html += `<p><strong>${key}:</strong> <span class="result-value">${value}</span></p>`;
        });
        resultDisplay.innerHTML = html;
    }
    
    resultDisplay.classList.add('active');
}

// ===== CLOSE CALCULATOR =====
function closeCalculator() {
    document.getElementById('calculatorModal').classList.remove('active');
}

// ===== FILTER CALCULATORS =====
function filterCalculators(category) {
    const cards = document.querySelectorAll('.calculator-card');
    cards.forEach(card => {
        if (category === 'all' || card.getAttribute('data-category') === category) {
            card.style.display = '';
        } else {
            card.style.display = 'none';
        }
    });
}

// ===== SEARCH CALCULATORS =====
function searchCalculators() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const cards = document.querySelectorAll('.calculator-card');
    
    cards.forEach(card => {
        const keywords = card.getAttribute('data-keywords').toLowerCase();
        const title = card.querySelector('h3').textContent.toLowerCase();
        const description = card.querySelector('p').textContent.toLowerCase();
        
        if (keywords.includes(searchTerm) || title.includes(searchTerm) || description.includes(searchTerm)) {
            card.style.display = '';
        } else {
            card.style.display = 'none';
        }
    });
}

// ===== CLOSE MODAL ON CLICK OUTSIDE =====
window.onclick = function(event) {
    const modal = document.getElementById('calculatorModal');
    if (event.target == modal) {
        modal.classList.remove('active');
    }
}