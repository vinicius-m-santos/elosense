import { motion } from "framer-motion";

const Loader = ({ loading }: { loading: boolean }) => {
    return (
        loading && (
            <div className="fixed inset-0 flex items-center justify-center bg-white/10 backdrop-blur-sm z-50">
                <motion.div
                    className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full"
                    animate={{ rotate: 360 }}
                    transition={{
                        repeat: Infinity,
                        duration: 1,
                        ease: "linear",
                    }}
                />
            </div>
        )
    );
};

export default Loader;
