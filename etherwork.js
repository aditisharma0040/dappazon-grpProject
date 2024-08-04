import { ethers } from 'ethers';
import readline from 'readline';

const RPC_URL = 'https://rpc.ankr.com/eth_sepolia'; // Replace with your network RPC URL
const CONTRACT_ADDRESS = '0x15FCf80d3ee270455d596c93bb37B4f1E1Aa15F7'; // Replace with your smart contract address

const CONTRACT_ABI = [
    "event Buy(address indexed buyer, uint256 orderId, uint256 itemId)",
    "event List(string name, uint256 cost, uint256 quantity)",
    "function list(uint256 _id, string memory _name, string memory _category, string memory _image, uint256 _cost, uint256 _rating, uint256 _stock) public",
    "function buy(uint256 _id) external payable",
    "function withdraw() public",
    "function getItem(uint256 _id) external view returns (tuple(uint256 id, string name, string category, string image, uint256 cost, uint256 rating, uint256 stock))",

    "function getOrders() external view returns (tuple(uint256 time, tuple(uint256 id, string name, string category, string image, uint256 cost, uint256 rating, uint256 stock))[])"
];

async function createContractInstance(privateKey) {
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const wallet = new ethers.Wallet(privateKey, provider);
    return new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, wallet);
}

function promptUser(question) {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
    return new Promise((resolve) => {
        rl.question(question, (answer) => {
            rl.close();
            resolve(answer);
        });
    });
}

// Example function to list an item
async function listItem(privateKey, itemDetails) {
    const contract = await createContractInstance(privateKey);
    const { id, name, category, image, cost, rating, stock } = itemDetails;

    const tx = await contract.list(id, name, category, image, cost, rating, stock);
    await tx.wait(); // Wait for the transaction to be mined
    console.log(`Item listed with ID: ${id}`);
}

// Example function to buy an item
async function buyItem(privateKey, itemId, itemCost) {
    const contract = await createContractInstance(privateKey);

    const tx = await contract.buy(itemId, { value: itemCost });
    await tx.wait(); // Wait for the transaction to be mined
    console.log(`Item with ID ${itemId} bought`);
}

// Example function to get an item
async function getItem(privateKey, itemId) {
    const contract = await createContractInstance(privateKey);
    const item = await contract.getItem(itemId);
    console.log(`Item Details:`, item);
}

// Example function to get orders
async function getOrders(privateKey) {
    const contract = await createContractInstance(privateKey);
    const orders = await contract.getOrders();
    console.log(`User Orders:`, orders);
}

// Main function to handle user input and execute functions
async function main() {
    try {
        const privateKey = await promptUser('Enter your private key: ');
        const action = await promptUser('Enter action (list/buy/getItem/getOrders): ');

        if (action === 'list') {
            const itemDetails = {
                id: parseInt(await promptUser('Enter item ID: ')),
                name: await promptUser('Enter item name: '),
                category: await promptUser('Enter item category: '),
                image: await promptUser('Enter item image URL: '),
                cost: ethers.parseEther(await promptUser('Enter item cost (ETH): ')),
                rating: parseInt(await promptUser('Enter item rating: ')),
                stock: parseInt(await promptUser('Enter item stock: '))
            };
            await listItem(privateKey, itemDetails);
        } else if (action === 'buy') {
            const itemId = parseInt(await promptUser('Enter item ID to buy: '));
            const itemCost = ethers.parseEther(await promptUser('Enter item cost (ETH): '));
            await buyItem(privateKey, itemId, itemCost);
        } else if (action === 'getItem') {
            const itemId = parseInt(await promptUser('Enter item ID to get: '));
            await getItem(privateKey, itemId);
        } else if (action === 'getOrders') {
            await getOrders(privateKey);
        } else {
            console.log('Unknown action.');
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

main();
