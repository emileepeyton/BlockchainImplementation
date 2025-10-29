# Blockchain Logger Implementation
The Blockchain Logger is a proof-of-concept prototype that securely captures Windows Event Logs and stores them on a private Ethereum blockchain to ensure tamper-proof, immutable and verifiable log storage. 

Before running the implementation, the following will need to be installed: <br>
- Node.js (https://nodejs.org) <br>
- Ganache (https://trufflesuite.com/ganache/) <br> 

Once you have cloned or downloaded the repository, you can then install all the necessary dependencies by running: <br> 
*npm install* <br> 

Now that the repository is set up, and the dependencies installed, the batch file needs to be added to the task scheduler. To do this, Windows Powershell with administrator privileges must be used to run the following command: <br>

*schtasks /create /sc minute /mo 2 /tn "BlockchainLogMonitor" /tr "cmd /c \"D:\Varsity Work\Honours\COS700\Implementation\runLogMonitor.bat\"" /ru SYSTEM /rl HIGHEST* <br> 

(Please replace the path name with the path to the runLogMonitor.bat file in the repository on your system) 

Once running this command, you should be able to see the batch file in your task scheduler as shown here: 
<img width="1297" height="811" alt="Screenshot 2025-10-29 071550" src="https://github.com/user-attachments/assets/9fc4fa9c-5ef5-4e07-b880-3d9d334ea430" />


Please also ensure that the path In your runLogMonitor.bat file is the path to the repository on your machine: 
<img width="867" height="186" alt="Screenshot 2025-10-29 071706" src="https://github.com/user-attachments/assets/980df20e-1cc4-4aef-9e5f-663ccfa49b05" />


Next, you will need to start Ganache and copy + paste the private key to the repository. Once you start Ganache, the following will be shown, you can click the quickstart button: 

<img width="1476" height="795" alt="Screenshot 2025-10-29 072010" src="https://github.com/user-attachments/assets/519f1923-81e3-4ddc-b7a4-663a91c9af78" />


Then you will be shown the following screen: 
<img width="1467" height="586" alt="Screenshot 2025-10-29 072254" src="https://github.com/user-attachments/assets/01ff33c6-dc9a-478d-a246-47d41d3820aa" />


You can click on any of the keys to capture a private key for that address, the private key will then be shown as such: 
<img width="847" height="386" alt="Screenshot 2025-10-29 072402" src="https://github.com/user-attachments/assets/1baa4e89-d968-4517-8891-719ddb856bce" />


Copy this key, and paste it into your hardhat.config file in the repository, as shown below: 
<img width="886" height="452" alt="Screenshot 2025-10-29 072458" src="https://github.com/user-attachments/assets/1fa74c64-7a62-4177-8aed-376b84a887fd" />


Before the first run, please remember to clear the last-log.json file as shown: 
<img width="1311" height="201" alt="Screenshot 2025-10-29 072635" src="https://github.com/user-attachments/assets/b1158ca6-8dcc-45c2-a220-134fca8e7757" />

Remember to then save the files before running the following commands. 

First, compile the implementation with the following code: <br> 
*npx hardhat compile* <br>
<img width="630" height="63" alt="Screenshot 2025-10-29 072812" src="https://github.com/user-attachments/assets/742fa344-b92a-4a20-bf42-2f0164f749b4" />


Then run the following to deploy the code: <br> 
*npx hardhat run scripts/deploy.js --network ganache* <br> 
 <img width="927" height="65" alt="Screenshot 2025-10-29 072929" src="https://github.com/user-attachments/assets/aa1bc4a5-1b52-40ce-8b91-8bda49747b6c" />


Then, ensure the scheduled task from earlier is enabled and running, you can run it for the first time from the task scheduler and then it should run automatically every 2 minutes from that point forward. This is done by selecting the task and clicking run on the right hand side: 

<img width="1674" height="503" alt="Screenshot 2025-10-29 073327" src="https://github.com/user-attachments/assets/685bb376-a25d-4774-aa82-333473e8ead1" />


You should then be able to see that logs have been added to the blockchain: 
<img width="1478" height="988" alt="Screenshot 2025-10-29 073451" src="https://github.com/user-attachments/assets/175715fa-adf0-4934-8c5f-954488b73f27" />


To view these logs on the server, you will need to run the following command to start the server: <br>
*npx hardhat run scripts/sever.js --network ganache*
<img width="914" height="61" alt="Screenshot 2025-10-29 073633" src="https://github.com/user-attachments/assets/fb820c03-fab1-4da6-a896-58791207aff4" />


The server can then be opened on the browser:
<img width="1912" height="721" alt="Screenshot 2025-10-29 073737" src="https://github.com/user-attachments/assets/28e18e7d-80fc-4c00-9a33-a0d124293ecc" />

On each refresh of the page, any new logs (if generated and captured in that time) will then be displayed as well. 





