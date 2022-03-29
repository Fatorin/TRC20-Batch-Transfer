import React from "react";
import TronWeb from 'tronweb';
import BigNumber from 'bignumber.js';

const selfAccount = "YOUR_ACCOUNT_ADDRESS";
//Don't share this API KEY in anywhere.
const privateKey = "YOUR_PRIVATEKY";

const testNode = 'https://api.shasta.trongrid.io';
const mainNode = 'https://api.trongrid.io';
const tronWeb = new TronWeb(mainNode, mainNode, mainNode, privateKey)

const ContractAddress = "YOUR_TRC20_TOKEN_CONTRACT_ADDRESS";

//If work on mainNode, your need apply API KEY from https://www.trongrid.io/
//tronWeb.setHeader({"TRON-PRO-API-KEY": 'YOUR_TRON_PRO_API_KEY'});

class TransferForm extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            value: "",
            instance: null,
            canTransfer: false,
            currectState: "",
            showState: false,
            lock: false,
        };

        this.handleChange = this.handleChange.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
        this.getContract();
    }

    handleChange(event) {
        this.setState({ value: event.target.value });
    }

    handleSubmit(event) {
        if (!this.state.canTransfer) {
            alert("The TRC20 token failed to load, you cannot use it.");
            return;
        }
        this.transfer();
        event.preventDefault();
    }

    async transfer() {
        this.setState({ lock: true });
        if (this.state.value === "") {
            this.setState({ currectState: "Data can't be empty." });
            return;
        }

        let datas = this.state.value.split(/\r\n|\n|\r/);
        for (let index = 0; index < datas.length; index++) {
            let data = datas[index].split(/,/);
            if (data.length !== 2) {
                console.log("There is a problem with the data in " + (index + 1) + " line, please check.");
                return;
            }

            if (!tronWeb.isAddress(data[0])) {
                console.log("There is a problem with the data in line " + (index + 1) + " of the account, please check.");
                return;
            }

            if (isNaN(data[1])) {
                console.log("There is a problem with the data in line " + (index + 1) + " of the amount, please check.");
                return;
            }
        }

        console.log("Data check success, nowo start transfer work.");
        try {
            for (let index = 0; index < datas.length; index++) {
                let data = datas[index].split(/,/);
                let transferCount = new BigNumber(1000000000000000000 * data[1]).toFixed();
                await this.delay(1);
                //const resp = await this.state.instance.methods.transfer(data[0], data[1]).send({ shouldPollResponse: true });
                const resp = await this.state.instance.methods.transfer(data[0], transferCount).send();
                if (resp === true) {
                    console.log("The " + data[1] + "transfer to " + data[0] + " was successful.");
                } else {
                    console.log("The " + data[1] + "transfer to " + data[0] + " has been broadcast.");
                }
            }
        } catch (error) {
            this.setState({ currectState: "Contract excute fail:" + error });
            console.log(error);
            this.setState({ value: "" });
            console.log("Data cleared.");
            this.setState({ lock: false });
        }

        this.setState({ value: "" });
        console.log("Data cleared.");
        this.setState({ lock: false });
    }

    async getContract() {
        let instance = await tronWeb.contract().at(ContractAddress);
        if (instance === undefined || instance === null) {
            this.setState({ currectState: "Failed to load contract, please check contract address。" });
            this.setState({ canTransfer: false });
            return;
        }
        const allowance = await instance.methods.balanceOf(selfAccount).call();
        console.log("Your have token quantity =", allowance.toString());
        this.setState({ showState: true });
        this.setState({ instance: instance });
        this.setState({ canTransfer: true });
        this.setState({ currectState: "The contract was loaded successfully, now you can start transfer." });
    }

    delay(n) {
        return new Promise(function (resolve) {
            setTimeout(resolve, n * 1000);
        });
    }

    render() {
        return (
            <div>
                <h3>Your TRC20 Token Contract Address:{ContractAddress}</h3>
                <form onSubmit={this.handleSubmit}>
                    <textarea style={{ height: "5rem", width: "60rem", resize: "none" }} placeholder="Please fill in the account and amount you want to transfer from. Example:TUj9UeqH4Cj3tqumA84kehaCEjr4yEMJEZ,2000" value={this.state.value} onChange={this.handleChange} disabled={this.state.lock} /><br />
                    <input type="submit" value="Send" />
                </form>
                {
                    this.state.showState ? <span>Satte{this.state.currectState}</span> : null
                }
            </div>
        );
    }
}

export default TransferForm;
