"use client";

import { motion } from "framer-motion";
import Wavify from "react-wavify";

export default function Wave() {
  return (
    <motion.div
      initial={{ y: "-100%" }}
      animate={{ y: 0 }}
      transition={{
        duration: 1,
        ease: "easeInOut",
      }}
    >
      <h1 className="text-[50px] font-semibold pt-20 w-full text-center  bg-[#042154]">
        ورود
      </h1>
      <Wavify
        fill="#042154"
        paused={false}
        options={{
          height: 20,
          amplitude: 50,
          speed: 0.1,
          points: 3,
        }}
        className="h-[180px] w-full rotate-180"
      />
    </motion.div>
  );
}
