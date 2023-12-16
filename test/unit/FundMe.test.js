const { assert, expect } = require("chai")
const { network, deployments, ethers, upgrades } = require("hardhat")
const { developmentChains } = require("../../helper-hardhat-config")
const { getFunctionDocumentation } = require("typechain")
const { TransactionResponse } = require("ethers")

// const {
//     isCallTrace,
// } = require("hardhat/internal/hardhat-network/stack-traces/message-trace")

describe("FundMe", function () {
    let fundMe
    let deployer
    let mockV3Aggregator
    const sendValue = "1000000000000000000" // 1 eth
    beforeEach(async () => {
        // const accounts = await ethers.getSigners()
        // deployer = accounts[0]
        deployer = (await getNamedAccounts()).deployer
        await deployments.fixture(["all"])
        fundMe = await ethers.getContract("FundMe", deployer)
        mockV3Aggregator = await ethers.getContract(
            "MockV3Aggregator",
            deployer
        )
    })

    describe("constructor", function () {
        it("sets the aggregator addresses correctly", async () => {
            const response = await fundMe.gets_priceFeed()
            assert.equal(response, mockV3Aggregator.target)
        })
    })
    describe("fund", async function () {
        it("Fails if you don't send enough ETH", async function () {
            await expect(fundMe.fund()).to.be.revertedWith(
                "You need to spend more ETH!"
            )
        })
        it("Update the amount funded data structure", async function () {
            await fundMe.fund({ value: sendValue })
            const response = await fundMe.s_addressToAmountFunded(deployer)
            assert.equal(response.toString(), sendValue.toString())
        })
        it("Adds funder to array of getFounder", async function () {
            await fundMe.fund({ value: sendValue })
            const funder = await fundMe.getFounder(0)
            assert.equal(funder, deployer)
        })
    })

    describe("withdraw", async function () {
        beforeEach(async function () {
            await fundMe.fund({ value: sendValue })
        })

        // it("withdraws ETH from a single funder", async () => {
        //     // Arrange

        //     const startingFundMeBalance = await ethers.provider.getBalance(
        //         fundMe.target
        //     )

        //     const startingDeployerBalance = await ethers.provider.getBalance(
        //         deployer
        //     )

        //     // Act
        //     const transactionResponse = await fundMe.withdraw()
        //     const transactionReceipt = await transactionResponse.wait()
        //     const { gasUsed, gasCost } = transactionReceipt
        //     // const gasCost = gasUsed * effectiveGasPrice

        //     const endingFundMeBalance = await ethers.provider.getBalance(
        //         fundMe.target
        //     )
        //     const endingDeployerBalance = await ethers.provider.getBalance(
        //         deployer
        //     )

        //     // Assert
        //     // Maybe clean up to understand the testing
        //     assert.equal(endingFundMeBalance, 0)
        //     assert.equal(
        //         startingFundMeBalance.add(startingDeployerBalance).toString(),
        //         endingDeployerBalance.add(gasCost).toString()
        //     )
        // })
        // it("allows us to withdraw witn multiple getFounder", async function () {
        //     const accounts = await ethers.getSigners()
        //     for (let i = 1; i < 6; i++) {
        //         const fundMeConnectedContract = await fundMe.connect(
        //             accounts[i]
        //         )
        //         await fundMeConnectedContract.fund({ value: sendValue })
        //     }
        //     const startingFundMeBalance = await ethers.provider.getBalance(
        //         fundMe.target
        //     )

        //     const startingDeployerBalance = await ethers.provider.getBalance(
        //         deployer
        //     )

        //     ///Act

        //     const transactionResponse = await fundMe.withdraw()
        //     const transactionReceipt = await transactionResponse.wait()
        //     const { gasUsed, gasCost } = transactionReceipt
        //     // const gasCost = gasUsed * effectiveGasPrice

        //     //Assert
        //     const endingFundMeBalance = await ethers.provider.getBalance(
        //         fundMe.target
        //     )
        //     const endingDeployerBalance = await ethers.provider.getBalance(
        //         deployer
        //     )

        //     // Assert
        //     // Maybe clean up to understand the testing
        //     assert.equal(endingFundMeBalance, 0)
        //     assert.equal(
        //         startingFundMeBalance + startingDeployerBalance,
        //         endingDeployerBalance + gasCost
        //     )
        //     await expect(fundMe.funder(0)).to.be.reverted
        //     for (i = 1; i < 6; i++) {
        //         assert.equal(
        //             await fundMe.s_addressToAmountFunded(accounts[i].address),
        //             0
        //         )
        //     }
        // })

        it("Only allows the owner to withdraw 1", async function () {
            const accounts = await ethers.getSigners()
            const attacker = accounts[1]
            const attackerConnectedContract = await fundMe.connect(attacker)
            await expect(attackerConnectedContract.withdraw()).to.be.reverted
        })
    })
})
