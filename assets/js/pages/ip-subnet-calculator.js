// IP Helper Functions
function ipToInt(ip) {
    return ip.split('.').reduce((int, oct) => (int << 8) + parseInt(oct, 10), 0) >>> 0;
}

function intToIp(int) {
    return [
        (int >>> 24) & 255,
        (int >>> 16) & 255,
        (int >>> 8) & 255,
        int & 255
    ].join('.');
}

function intToBinary(int) {
    let bin = (int >>> 0).toString(2);
    while (bin.length < 32) bin = "0" + bin;
    // Insert dots for readability
    return bin.match(/.{1,8}/g).join('.');
}

// Main Logic
function calculate() {
    const ipStr = document.getElementById('ipAddress').value.trim();
    const cidr = parseInt(document.getElementById('cidr').value);

    // Validate IP regex
    const ipRegex = /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;

    if (!ipRegex.test(ipStr)) {
        alert("Please enter a valid IPv4 address.");
        return;
    }

    const ipInt = ipToInt(ipStr);
    // Calculate Mask Int
    const maskInt = -1 << (32 - cidr);
    const networkInt = ipInt & maskInt;
    const broadcastInt = networkInt | (~maskInt);
    const wildcardInt = ~maskInt;

    // Hosts
    const totalHosts = Math.pow(2, 32 - cidr);
    const usableHosts = (cidr >= 31) ? 0 : totalHosts - 2;

    const firstInt = (cidr >= 31) ? 0 : networkInt + 1;
    const lastInt = (cidr >= 31) ? 0 : broadcastInt - 1;

    // Determine Class
    const firstOctet = parseInt(ipStr.split('.')[0]);
    let ipClass = '';
    if (firstOctet >= 0 && firstOctet <= 127) ipClass = 'A';
    else if (firstOctet >= 128 && firstOctet <= 191) ipClass = 'B';
    else if (firstOctet >= 192 && firstOctet <= 223) ipClass = 'C';
    else if (firstOctet >= 224 && firstOctet <= 239) ipClass = 'D (Multicast)';
    else if (firstOctet >= 240 && firstOctet <= 255) ipClass = 'E (Experimental)';

    // Determine Type (Private/Public) - Simplified check
    let ipType = 'Public';
    // 10.0.0.0/8
    if (firstOctet === 10) ipType = 'Private';
    // 172.16.0.0/12
    else if (firstOctet === 172 && (parseInt(ipStr.split('.')[1]) >= 16 && parseInt(ipStr.split('.')[1]) <= 31)) ipType = 'Private';
    // 192.168.0.0/16
    else if (firstOctet === 192 && parseInt(ipStr.split('.')[1]) === 168) ipType = 'Private';

    // Render
    document.getElementById('resultsPlaceholder').classList.add('hidden');
    document.getElementById('resultsContent').classList.remove('hidden');

    const netAddr = intToIp(networkInt);
    document.getElementById('resNetwork').textContent = netAddr;
    document.getElementById('resCidr').textContent = `/${cidr}`;

    document.getElementById('resIP').textContent = ipStr;
    document.getElementById('resMask').textContent = intToIp(maskInt);
    document.getElementById('resBroadcast').textContent = intToIp(broadcastInt);
    document.getElementById('resFirst').textContent = (cidr >= 31) ? 'N/A' : intToIp(firstInt);
    document.getElementById('resLast').textContent = (cidr >= 31) ? 'N/A' : intToIp(lastInt);
    document.getElementById('resTotalHosts').textContent = totalHosts.toLocaleString();
    document.getElementById('resUsableHosts').textContent = usableHosts.toLocaleString();
    document.getElementById('resClass').textContent = ipClass;
    document.getElementById('resType').textContent = ipType;
    document.getElementById('resWildcard').textContent = intToIp(wildcardInt);

    document.getElementById('binIP').textContent = intToBinary(ipInt);
    document.getElementById('binMask').textContent = intToBinary(maskInt);
}

function clearForm() {
  document.getElementById('ipAddress').value = "";
  document.getElementById('cidr').value = "24";

  document.getElementById('resultsContent').classList.add('hidden');
  document.getElementById('resultsPlaceholder').classList.remove('hidden');
}
