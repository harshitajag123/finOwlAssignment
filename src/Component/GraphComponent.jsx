import React, { useState, useEffect } from "react";
import style from "./graph.module.css";
import axios from "axios";
import {
	LineChart,
	Line,
	AreaChart,
	Area,
	XAxis,
	YAxis,
	Tooltip,
	ResponsiveContainer,
} from "recharts";

// Utility function for formatting dates
const formatDate = (date, timeRange) => {
	const dateObj = new Date(date);
	if (isNaN(dateObj)) return "Invalid Date";
	const options = {
		"1D": { hour: "2-digit", minute: "2-digit", timeZone: "UTC" },
		default: {
			year: "numeric",
			month: "short",
			day: "2-digit",
			timeZone: "UTC",
		},
	};
	return dateObj.toLocaleString("en-US", options[timeRange] || options.default);
};

const GraphComponent = () => {
	const [data, setData] = useState([]);
	const [timeRange, setTimeRange] = useState("7D");

	const fetchData = async (fromDate, toDate) => {
		try {
			const response = await axios.post(
				"http://65.1.228.250:8080/fxd_trading/rate_feed/getRateFeed",
				{
					currencyPairs: ["EUR-USD"],
					fromDate,
					toDate,
				}
			);
			if (response.data.httpStatusCode === "OK") {
				const formattedData = response.data.result.map((item) => ({
					date: timeRange === "1D" ? item.time : item.date,
					rate: (item.closeBid + item.closeAsk) / 2,
				}));
				setData(formattedData);
				console.log("Fetched Data:", formattedData); // Log the data
			} else {
				console.error("Failed to fetch data:", response.data.message);
			}
		} catch (error) {
			console.error("Error fetching data:", error);
		}
	};

	//to calculate the date range based on the time range
	const calculateDateRange = () => {
		const today = new Date();
		let fromDate;
		switch (timeRange) {
			case "1D":
				fromDate = new Date(today);
				fromDate.setUTCHours(0, 0, 0, 0);
				break;
			case "7D":
				fromDate = new Date(today);
				fromDate.setDate(today.getDate() - 7);
				break;
			case "1M":
				fromDate = new Date(today);
				fromDate.setMonth(today.getMonth() - 1);
				break;
			case "6M":
				fromDate = new Date(today);
				fromDate.setMonth(today.getMonth() - 6);
				break;
			case "1Y":
				fromDate = new Date(today);
				fromDate.setFullYear(today.getFullYear() - 1);
				break;
			default:
				fromDate = today;
		}
		return {
			fromDate: fromDate.toISOString().split("T")[0],
			toDate: today.toISOString().split("T")[0],
		};
	};

	// Generate evenly spaced X-axis ticks
	const generateXAxisTicks = (data, interval) => {
		const ticks = [];
		for (let i = 0; i < data.length; i += interval) {
			ticks.push(data[i]?.date);
		}
		return ticks;
	};

	// To Fetch data based on the selected time range
	useEffect(() => {
		const { fromDate, toDate } = calculateDateRange();
		fetchData(fromDate, toDate);
		console.log("Updated Data:", data); // Log the updated data
	}, [timeRange]);

	// to format tick values based on time range
	const tickFormatter = (tick) => {
		const dateObj = new Date(tick);
		return timeRange === "1D"
			? dateObj.toLocaleTimeString("en-US", {
					hour: "2-digit",
					minute: "2-digit",
			  })
			: dateObj.toLocaleDateString("en-US", { month: "short", day: "2-digit" });
	};

	//tooltip content
	const CustomTooltip = ({ active, payload }) => {
		if (active && payload && payload.length) {
			const { date, rate } = payload[0].payload;
			return (
				<div className={style.tooltip}>
					<p className={style.dataTooltip}>{formatDate(date, timeRange)}</p>
					<p className={style.dataTooltip}>Rate: {rate.toFixed(4)}</p>
				</div>
			);
		}
		return null;
	};

	// Set the ticks interval based on the time range
	const getTicksInterval = (timeRange) => {
		switch (timeRange) {
			case "7D":
				return 1; 
			case "1M":
				return 2; 
			case "6M":
				return 6; 
			case "1Y":
				return 10; 
			default:
				return 1; // Default to 1 tick for unknown ranges
		}
	};

	return (
		<div className={style.container1}>
			<div className={style.container}>
				<h2 className={style.title}>EUR-USD Rate Graph</h2>
				<div className={style.buttonContainer}>
					{["1D", "7D", "1M", "6M", "1Y"].map((range) => (
						<button
							key={range}
							onClick={() => setTimeRange(range)}
							style={{
								margin: "0 1px",
								padding: "8px 20px",
								border:
									timeRange === range
										? "2px solid white"
										: "1px solid transparent",
								color: timeRange === range ? "white" : "rgb(151, 147, 147)",
								borderRadius: "15px",
								background: "transparent",
								transition: "all 0.3s ease",
							}}>
							{range}
						</button>
					))}
				</div>
				<ResponsiveContainer width="100%" height={300}>
					<AreaChart
						data={data}
						margin={{ top: 20, right: 30, bottom: 20, left: 0 }}>
						{/* X Axis */}
						<XAxis
							dataKey="date"
							tickFormatter={tickFormatter}
							ticks={generateXAxisTicks(data, getTicksInterval(timeRange))}
							tick={{ fontSize: 12, fill: "white" }}
							//axisLine={false} // Remove axis line
							//tickLine={false} // Remove tick lines
							padding={{ left: 20, right: 20 }}
						/>
						{/* Y Axis */}
						<YAxis
							domain={["auto", "auto"]}
							tick={{ fontSize: 12, fill: "white" }}
							axisLine={false} // Remove axis line
							tickLine={false} // Remove tick lines
							padding={{ top: 10, bottom: 10 }}
						/>
						{/* Tooltip */}
						<Tooltip
							content={<CustomTooltip />}
							wrapperStyle={{
								backgroundColor: "transparent", // Ensure no black box
								border: "none",
								zIndex: 1000,
							}}
						/>
						{/* Shadow Area */}
						<defs>
							<linearGradient id="shadowGradient" x1="0" y1="0" x2="0" y2="1">
								<stop offset="0%" stopColor="#00FF7F" stopOpacity={0.5} />
								<stop offset="100%" stopColor="#00FF7F" stopOpacity={0} />
							</linearGradient>
						</defs>
						{/* Shadow with Area */}
						<Area
							type="monotone"
							dataKey="rate"
							stroke="#00FF7F" 
							fill="url(#shadowGradient)"
							strokeWidth={2}							
							activeDot={{
								fill: "white", 
								r: 2.5, 
								
							}}
							// activeShape={{
							// 	stroke: "#00FF7F", 
							// 	strokeWidth: 0.3,
							// 	opacity: 0.9, 
							// }}
						/>
					</AreaChart>
				</ResponsiveContainer>
			</div>
		</div>
	);
};

export default GraphComponent;
