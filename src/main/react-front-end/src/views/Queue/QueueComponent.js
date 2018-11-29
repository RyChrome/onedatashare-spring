import React, { Component } from 'react';
import { queue, cancelJob } from '../../APICalls/APICalls';

import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableHead from '@material-ui/core/TableHead';
import Button from '@material-ui/core/Button';
import TableRow from '@material-ui/core/TableRow';
import { ProgressBar, Grid, Row, Col } from 'react-bootstrap';
import Paper from '@material-ui/core/Paper';
import AppBar from '@material-ui/core/AppBar';
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';

import './QueueComponent.css';

export default class QueueComponent extends Component {

	constructor(){
		super();
		this.state = {response:[],
					  selectedTab: 0 };
		let queueFunc = () => {queue((resp) => {
			//success
			resp.sort((a, b) => { return b.job_id - a.job_id});
			this.setState({response:resp});
		}, (resp) => {
			//failed
			console.log('Error in queue request to API layer');
		})};
		queueFunc();
		this.interval = setInterval(queueFunc, 2000);    //making a queue request every 2 seconds
		var infoRowsIds= [];
		var selectedJobInfo = 0;
		this.toggleTabs = this.toggleTabs.bind(this);
	}

	componentWillUnmount(){
		clearInterval(this.interval);
	}

	getStatus(status, total, done){
		const style = {marginTop: '5%', fontWeight: 'bold'};
		if(status === 'complete'){
			return(<ProgressBar now={100} label={'Complete'} style={style} />);
		}
		else if(status === 'failed' || status === 'removed'){
			return(<ProgressBar bsStyle="danger" now={100} style={style} label={'Failed'} />);
		}
		else{
			var percentCompleted = Math.ceil(((done/total) * 100));
			return(<ProgressBar bsStyle="danger" now={percentCompleted} style={style} label={'Processing ' + percentCompleted + '%'} />);
		}
	}

	renderSpeed(speedInBps){
		var displaySpeed = "";
		if(speedInBps > 1000000000){
			displaySpeed = (speedInBps/1000000000).toFixed(2) + " GB/s";
		}
		else if(speedInBps > 1000000){
			displaySpeed = (speedInBps/1000000).toFixed(2) + " MB/s";
		}
		else if(speedInBps > 1000){
			displaySpeed = (speedInBps/1000).toFixed(2) + " KB/s";
		}
		else{
			displaySpeed = speedInBps + " B/s";
		}

		return displaySpeed;
	}

	infoButtonOnClick(jobID){
		var row = document.getElementById("info_" + jobID);
		if(this.selectedJobInfo === jobID && row.style.display != "none"){
			row.style.display = "none";
		}
		else{
			var row2close = document.getElementById("info_" + this.selectedJobInfo);
			if(row2close)
				row2close.style.display = "none";
			row.style.display = "table-row";
			this.selectedJobInfo = jobID;
		}
	}


	cancelButtonOnClick(jobID){
		cancelJob(jobID, (resp) => {
			//success
			this.queueFunc();
		}, (resp) => {
			//failed
			console.log('Error in cancel request to API layer');
		});
	}

	getFormattedDate(d){
		return (d.getMonth() + '/' + d.getDate() + '/' + d.getFullYear() + ' ' + d.getHours() + ':' + d.getMinutes() + ':' + d.getSeconds());
	}

	toggleTabs(){
		if(this.state.selectedTab === 0)
			this.setState({selectedTab: 1});
		else
			this.setState({selectedTab: 0});
	}

	renderActions(jobID, status){
		var disabledFlag = true;
		if(status === 'processing')
			disabledFlag = false;
		return(
			<div>
				<Button onClick={() => {this.infoButtonOnClick(jobID)}} variant="contained" size="small" color="primary" 
					style={{backgroundColor: 'rgb(224, 224, 224)', color: '#333333', fontFamily: 'FontAwesome', fontSize: '1.5rem', 
					fontWeight: 'bold', width: '50%', textTransform: 'none', 
					minWidth: '0px', minHeigth: '0px'}}>
	          		i
	        	</Button>
	        	<Button onClick={() => {this.cancelButtonOnClick(jobID)}} disabled={{disabledFlag}} variant="contained" size="small" color="primary" 
	        		style={{backgroundColor: '#EEEEEE', color: '#333333', fontSize: '1.5rem', fontWeight: 'bold', width: '50%', 
	        		textTransform: 'none', minWidth: '0px', minHeigth: '0px'}}>
	          		x
	        	</Button>
        	</div>
		);
	}

	renderTabContent(resp){
		var scheduledDate = new Date(resp.times.scheduled);
		var startedDate = new Date(resp.times.started);
		var completedDate = new Date(resp.times.completed);

		if(this.state.selectedTab === 0){
			return(
				<Grid style={{ paddingTop : '0.5%', paddingBottom: '0.5%', width: '100%' }}>
					<Row>
						<Col md={6}><b>User</b></Col>
						<Col md={6}>{resp.owner}</Col>
					</Row>
					<Row>
						<Col md={6}><b>Job ID</b></Col>
						<Col md={6}>{resp.job_id}</Col>
					</Row>
					<Row>
						<Col md={6}><b>Source</b></Col>
						<Col md={6}>{resp.src.uri}</Col>
					</Row>
					<Row>
						<Col md={6}><b>Destination</b></Col>
						<Col md={6}>{resp.dest.uri}</Col>
					</Row>
					<Row>
						<Col md={6}><b>Instant Speed</b></Col>
						<Col md={6}>{this.renderSpeed(resp.bytes.inst)}</Col>
					</Row>
					<Row>
						<Col md={6}><b>Average Speed</b></Col>
						<Col md={6}>{this.renderSpeed(resp.bytes.avg)}</Col>
					</Row>
					<Row>
						<Col md={6}><b>Scheduled Time</b></Col>
						<Col md={6}>{this.getFormattedDate(scheduledDate)}</Col>
					</Row>
					<Row>
						<Col md={6}><b>Started Time</b></Col>
						<Col md={6}>{this.getFormattedDate(startedDate)}</Col>
					</Row>
					<Row>
						<Col md={6}><b>Completed Time</b></Col>
						<Col md={6}>{this.getFormattedDate(completedDate)}</Col>
					</Row>
					<Row>
						<Col md={6}><b>Time Duration</b></Col>
						<Col md={6}>{((resp.times.completed - resp.times.started)/1000).toFixed(2)} sec</Col>
					</Row>
					<Row>
						<Col md={6}><b>Attempts</b></Col>
						<Col md={6}>{resp.attempts}</Col>
					</Row>
					<Row>
						<Col md={6}><b>Status</b></Col>
						<Col md={6}>{resp.status}</Col>
					</Row>
				</Grid>
			);
		}
		else if (this.state.selectedTab === 1){
			return(
				<pre>{JSON.stringify(resp, null, "\t")}</pre>
			);
		}
	}

	render(){
		const height = window.innerHeight+"px";
		const {response} = this.state;
		const tbcellStyle= {textAlign: 'center'}


		var tableRows = [];
		response.map(resp => {
	      	 tableRows.push(
	      	 	<TableRow style={{alignSelf: "stretch"}}>
		            <TableCell component="th" scope="row" style={{...tbcellStyle, width: '7.5%',  fontSize: '1rem'}} numeric>
		              {resp.job_id}
		            </TableCell>
		            <TableCell style={{...tbcellStyle, width: '40%',  fontSize: '1rem'}}>
		            	{this.getStatus(resp.status, resp.bytes.total, resp.bytes.done)}
		            </TableCell>
		            <TableCell style={{...tbcellStyle, width: '7.5%',  fontSize: '1rem'}}>
		            	{this.renderSpeed(resp.bytes.avg)}
		            </TableCell>
		            <TableCell style={{...tbcellStyle, width: '35%', maxWidth: '20vw', overflow:"hidden", fontSize: '1rem', margin: "0px"}}>
		            	{decodeURI(resp.src.uri)}
		            </TableCell>
		            <TableCell style={{...tbcellStyle, width: '10%',  fontSize: '1rem'}}>
		            	{this.renderActions(resp.job_id, resp.status)}
		            </TableCell>
	          	</TableRow>
	        );
	      	tableRows.push(
	      	 	<TableRow id={"info_" + resp.job_id} style={{ display: 'none'}}>
	            	<TableCell colSpan={5} style={{...tbcellStyle, width: '10%',  fontSize: '1rem', backgroundColor: '#e8e8e8', margin: '2%' }}>
	            		<div id="infoBox" style={{ marginBottom : '0.5%' }}>
		            		<AppBar position="static" style={{ boxShadow: 'unset' }}>
								<Tabs value={this.state.selectedTab} onChange={this.toggleTabs} style={{ backgroundColor: '#e8e8e8' }}>
									<Tab style={{ backgroundColor: '#428bca', margin: '0.5%', borderRadius: '4px' }} label="Formatted" />
			            			<Tab style={{ backgroundColor: '#428bca', margin: '0.5%', borderRadius: '4px' }} label="JSON" />
		          				</Tabs>
		        			</AppBar>
		        			<div style={{ backgroundColor: 'white', borderRadius: '4px', textAlign: 'left', marginTop: '0.3%'}}>
		        				{this.renderTabContent(resp)}
		        			</div>
		        		</div>
	            	</TableCell>
	          	</TableRow>
	        );
		});

		return(
		<Paper style={{marginLeft: '10%', marginRight: '10%', marginTop: '5%', marginBottom: '10%', border: 'solid 2px #d9edf7'}}>
	  		<Table>
		        <TableHead style={{backgroundColor: '#d9edf7'}}>
		          <TableRow>
		            <TableCell style={{...tbcellStyle, width: '7.5%',  fontSize: '2rem', color: '#31708f'}}>Job ID</TableCell>
		            <TableCell style={{...tbcellStyle, width: '40%',  fontSize: '2rem', color: '#31708f'}}>Progress</TableCell>
		            <TableCell style={{...tbcellStyle, width: '7.5%',  fontSize: '2rem', color: '#31708f'}}>Average Speed</TableCell>
		            <TableCell style={{...tbcellStyle, width: '35%',  fontSize: '2rem', color: '#31708f'}}>Source/Destination</TableCell>
		            <TableCell style={{...tbcellStyle, width: '10%',  fontSize: '2rem', color: '#31708f'}}>Actions</TableCell>
		          </TableRow>
		        </TableHead>
		        <TableBody>
		            {tableRows}
		        </TableBody>
	      	</Table>  
      	</Paper>
		);
	}
}