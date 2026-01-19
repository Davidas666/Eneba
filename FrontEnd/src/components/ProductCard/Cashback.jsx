import refundIcon from '../../assets/svg_57.svg';

const Cashback = () => {
  return (
    <div className="flex items-center gap-1 bg-[#63e3c2] text-[rgb(31,10,77)] px-3 py-2 text-xs font-bold">
      <img src={refundIcon} alt="refund" className="w-4 h-4" />
      Cashback
    </div>
  );
};

export default Cashback;
