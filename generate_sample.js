import XLSX from "xlsx";
import fs from "fs";

const data = [
  {
    Mobile: "01711223344",
    "Head Name": "M Nafiz",
    Email: "nafiz@example.com",
    Group: "2010",
    Amount: 2000,
    Status: "Paid",
    "Participant Name": "M Nafiz",
    Gender: "Male",
    Age: 32,
    "T-Shirt Size": "L",
  },
  {
    Mobile: "01711223344",
    "Head Name": "M Nafiz",
    Email: "nafiz@example.com",
    Group: "2010",
    Amount: 2000,
    Status: "Paid",
    "Participant Name": "Mrs. Nafiz",
    Gender: "Female",
    Age: 28,
    "T-Shirt Size": "M",
  },
  {
    Mobile: "01855667788",
    "Head Name": "Abdullah",
    Email: "abdullah@example.com",
    Group: "Bsc 1st Batch",
    Amount: 1000,
    Status: "Pending",
    "Participant Name": "Abdullah",
    Gender: "Male",
    Age: 25,
    "T-Shirt Size": "XL",
  },
];

const worksheet = XLSX.utils.json_to_sheet(data);
const workbook = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(workbook, worksheet, "Registrations");

const buf = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
fs.writeFileSync("registration_sample_demo.xlsx", buf);

console.log("Sample file generated: registration_sample_demo.xlsx");
