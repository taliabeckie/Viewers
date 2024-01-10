import React, { useEffect, useState } from 'react';

const ProgressBar = props => {
  const { progressCheck, onComplete, onError } = props;

  const [completed, setCompleted] = useState(0);
  const [bgcolor, setBgcolor] = useState(props.bgcolor);

  let startCheck = true;

  const runCheck = async () => {
    const {jobProgress, statusCode} = progressCheck();
    if (jobProgress == 'FAILED') {
      setBgcolor('red');
      setCompleted(20);
      onError(statusCode);
    } else if (jobProgress == 'COMPLETE') {
      setBgcolor('green');
      setCompleted(100);
      onComplete();
    } else {
      setCompleted(jobProgress);
      setTimeout(() => runCheck(), 100);
    }
  };

  useEffect(() => {
    if (startCheck) {
      startCheck = false;
      runCheck();
    }
  }, [completed]);

  const containerStyles = {
    height: 20,
    width: '25em',
    backgroundColor: '#e0e0de',
    borderRadius: 50,
    margin: 50,
  };

  const fillerStyles = {
    height: '100%',
    width: `${completed}%`,
    backgroundColor: bgcolor,
    borderRadius: 'inherit',
    textAlign: 'right',
  };

  const labelStyles = {
    padding: 5,
    color: 'white',
    fontWeight: 'bold',
  };

  return (
    <div style={containerStyles}>
      <div style={fillerStyles}>
        <span style={labelStyles}>{`${completed}%`}</span>
      </div>
    </div>
  );
};

export default ProgressBar;
