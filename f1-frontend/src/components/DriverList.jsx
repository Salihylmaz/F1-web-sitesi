import DriverCard from './DriverCard';

function DriverList({ drivers }) {
  return (
    <div className="driver-list">
      {drivers.map((driver, index) => (
        <DriverCard key={driver.id} driver={driver} rank={index} />
      ))}
    </div>
  );
}

export default DriverList;