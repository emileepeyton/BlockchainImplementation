# BlockchainImplementation
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

<insert image>
<br> 
Please also ensure that the path In your runLogMonitor.bat file is the path to the repository on your machine: 
<br> 
<next image> 

Next, you will need to start Ganache and copy + paste the private key to the repository. Once you start Ganache, the following will be shown, you can click the quickstart button: 

<next image> 

Then you will be shown the following screen: 
<next image> 

You can click on any of the keys to capture a private key for that address, the private key will then be shown as such: 
<next image> 

Copy this key, and paste it into your hardhat.config file in the repository, as shown below: 
<next image> 

Before the first run, please remember to clear the last-log.json file as shown: 
<next image> 

Remember to then save the files before running the following commands. 

First, compile the implementation with the following code: <br> 
*npx hardhat compile*

<>

Then run the following to deploy the code: <br> 
*npx hardhat run scripts/deploy.js --network ganache*

<> 

Then, ensure the scheduled task from earlier is enabled and running, you can run it for the first time from the task scheduler and then it should run automatically every 2 minutes from that point forward. This is done by selecting the task and clicking run on the right hand side: 

<> 

You should then be able to see that logs have been added to the blockchain: 
<>

To view these logs on the server, you will need to run the following command to start the server: <br>
*npx hardhat run scripts/sever.js --network ganache*

<> 

The server can then be opened on the browser:
<> 

On each refresh of the page, any new logs (if captured in that time) will then be displayed as well. 






