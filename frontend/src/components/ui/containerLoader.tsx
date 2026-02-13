import { motion } from "framer-motion";

const ContainerLoader = () => {
  return (
    <div className="w-full h-full min-h-[15rem] flex justify-center items-center">
      <motion.div
        className={`w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full`}
        animate={{ rotate: 360 }}
        transition={{
          repeat: Infinity,
          duration: 1,
          ease: "linear",
        }}
      />
    </div>
  );
};

export default ContainerLoader;
