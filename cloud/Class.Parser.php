<?php
// Copyright 2010 Daniel Friedman
class Parser
{
	private $log_contens;
	private $log_name = "./gwr";
	private $log_labels = array(
     	'SteeringWheel' => array(
      		'heatsinktemp' => 'Heatsink Temp',
      		'motortemp' => 'Motor Temp'
      	),
      	'GPS' => array(
           	'speed' => 'Speed',
           	'latitude' => 'Latitude',
           	'longitude' => 'Longitude'
         ),
		'Negsum' => array(
			'arraypower' => 'Array Power',
			'motorpower' => 'Motor Power',
			'batterypower' => 'Battery Power'
		)
    );
	private $recent_data;
	private $parsedData;
	
	public function __construct() {
		self::setData();
	}
	
	private function getLogContents() {
		echo "Retrieving scanalysis log...";
		if ($log = file_get_contents($this->log_name)) {
			echo "done\n";
			return $log;
		}
		else {
			echo "error";
		}
	}
	
	private function parseData ($log) {
     	foreach ($this->log_labels as $node => $channels) {
        	$pattern = "/".$node.".*/";
      		preg_match_all($pattern, $log, &$matches);
			//print_r($matches);
      		foreach ($matches[0] as $value) {
      			$tmp = preg_split("/[\t]/", $value);
      			foreach ($channels as $lkey => $lval) {
      				if ($lval == $tmp[1]) {
      					$vals[$tmp[3]] = array($lkey => $tmp[2]);
      				}
      			}
      		}
		}
		ksort($vals);
		return $vals;
	}
	
	private function makeUsefulArray($raw) {
		$starttime = key($raw);							// Set first timestamp time
		$interval = $starttime + 2;						// I group the data within 2 second intervals
		$i = 0;
		foreach ($raw as $timestamp => $dataArray) {
			if ($timestamp < $interval) {
				$key = key($dataArray);
				$out[$i][$key] = (isset($out[$i][$key])) ? ($out[$i][$key] + $dataArray[$key])/2 : $dataArray[$key];
				$out[$i]['timestamp'] = (isset($out[$i]['timestamp'])) ? $out[$i]['timestamp'] : $timestamp;
			}
			else {
				//echo "END BUFFER\nBEGIN BUFFER\n";
				$interval = $timestamp + 2;
				if (isset($out[$i])) $i++;
			}
		}
		$num = count($out);
		$diff = $timestamp - $starttime;
		$out['meta'] = array(
			'start' => $starttime,
			'end' => $timestamp,
			'diff' => $diff,
			'num' => $num
		);
		return $out;
	}
	
	public function setData () {
		$log = self::getLogContents();
		echo "Parsing data...";
		$this->parsedData = self::makeUsefulArray(self::parseData($log));
		echo "done\n";
	}
	
	public function getData() {
		return $this->parsedData;
	}
	
	
}
// End of class
?>