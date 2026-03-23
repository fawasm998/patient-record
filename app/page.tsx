"use client";

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function Home() {
  const emptyForm = {
    date: "",
    name: "",
    age: "",
    gender: "",
    address: "",
    chiefComplaint: "",
    hopi: "",
    medicalHistory: "",
    dentalHistory: "",
    habitHistory: "",
    extraOralExamination: "",
    intraOralExamination: "",
    xray: "",
    diagnosis: "",
    afterDiagnosis: "",
    rxPlan: "",
    rxDone: "",
    rx: "",
    additionalNotes: "",
  };

  const [formData, setFormData] = useState(emptyForm);
  const [patients, setPatients] = useState<any[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [customFields, setCustomFields] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // ================= FETCH =================
  async function fetchPatients() {
    const { data, error } = await supabase.from("patients").select("*");

    if (error) {
      console.error(error);
      alert("Error loading patients");
      return;
    }

    setPatients(data || []);
  }

  useEffect(() => {
    fetchPatients();
  }, []);

  // ================= FORM =================
  function handleChange(e: any) {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }

  // ================= SAVE =================
  async function handleSubmit(e: any) {
    e.preventDefault();
    setLoading(true);

    const finalData = {
      ...formData,
      customFields,
    };

    const { error } = await supabase.from("patients").insert([
      {
        data: finalData,
      },
    ]);

    if (error) {
      console.error(error);
      alert("Error saving patient: " + error.message);
    } else {
      alert("Patient saved successfully!");
      setFormData(emptyForm);
      setCustomFields([]);
      fetchPatients();
    }

    setLoading(false);
  }

  // ================= SELECT =================
  function toggleSelect(id: number) {
    setSelectedIds((prev) =>
      prev.includes(id)
        ? prev.filter((i) => i !== id)
        : [...prev, id]
    );
  }

  function selectAll() {
    setSelectedIds(patients.map((p) => p.id));
  }

  const selectedPatients = patients.filter((p) =>
    selectedIds.includes(p.id)
  );

  // ================= EXPORT PDF =================
  function exportPDF() {
  if (selectedPatients.length === 0) {
    alert("Please select at least one patient.");
    return;
  }

  const doc = new jsPDF();

  selectedPatients.forEach((p, index) => {
    doc.setFontSize(16);
    doc.text(`Patient ${index + 1}`, 10, 10);

    const rows: string[][] = Object.entries(p.data || {}).map(([k, v]) => [
      String(k ?? ""),
      v === undefined || v === null
        ? ""
        : typeof v === "object"
        ? JSON.stringify(v)
        : String(v),
    ]);

    autoTable(doc, {
      head: [["Field", "Value"]],
      body: rows,
      startY: 20,
    });

    if (index !== selectedPatients.length - 1) {
      doc.addPage();
    }
  });

  doc.save("patients.pdf");
}

  // ================= EXPORT EXCEL =================
  function exportExcel() {
    const data = selectedPatients.map((p) => p.data);
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Patients");

    XLSX.writeFile(workbook, "patients.xlsx");
  }

  // ================= CUSTOM FIELDS =================
  function addField() {
    setCustomFields([...customFields, { name: "", value: "" }]);
  }

  function updateField(i: number, key: string, value: string) {
    const updated = [...customFields];
    updated[i][key] = value;
    setCustomFields(updated);
  }

  function removeField(i: number) {
    setCustomFields(customFields.filter((_, index) => index !== i));
  }

  // ================= UI =================
  return (
    <main className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-5xl mx-auto bg-white p-8 rounded-xl shadow">

        <h1 className="text-3xl font-bold mb-6">
          Dr. Sara Fahana's Patient Record
        </h1>

        {/* ================= FORM ================= */}
        <form onSubmit={handleSubmit} className="grid gap-4">

          <input name="date" type="date" value={formData.date} onChange={handleChange} className="border p-2 rounded"/>
          <input name="name" placeholder="Name" value={formData.name} onChange={handleChange} className="border p-2 rounded"/>
          <input name="age" type="number" placeholder="Age" value={formData.age} onChange={handleChange} className="border p-2 rounded"/>

          <select name="gender" value={formData.gender} onChange={handleChange} className="border p-2 rounded">
            <option value="">Gender</option>
            <option>Male</option>
            <option>Female</option>
          </select>

          <textarea name="address" placeholder="Address" value={formData.address} onChange={handleChange} className="border p-2 rounded"/>
          <textarea name="chiefComplaint" placeholder="Chief Complaint" value={formData.chiefComplaint} onChange={handleChange} className="border p-2 rounded"/>
          <textarea name="hopi" placeholder="HOPI" value={formData.hopi} onChange={handleChange} className="border p-2 rounded"/>
          <textarea name="medicalHistory" placeholder="Medical History" value={formData.medicalHistory} onChange={handleChange} className="border p-2 rounded"/>
          <textarea name="dentalHistory" placeholder="Dental History" value={formData.dentalHistory} onChange={handleChange} className="border p-2 rounded"/>

          {/* CUSTOM FIELDS */}
          <div>
            <h2 className="font-bold mt-4">Custom Fields</h2>
            {customFields.map((f, i) => (
              <div key={i} className="flex gap-2 mb-2">
                <input placeholder="Field name" value={f.name} onChange={(e)=>updateField(i,"name",e.target.value)} className="border p-2"/>
                <input placeholder="Value" value={f.value} onChange={(e)=>updateField(i,"value",e.target.value)} className="border p-2"/>
                <button type="button" onClick={()=>removeField(i)} className="bg-red-500 text-white px-2">X</button>
              </div>
            ))}
            <button type="button" onClick={addField} className="bg-black text-white px-3 py-1 mt-2">
              Add Field
            </button>
          </div>

          <button type="submit" className="bg-black text-white p-3 rounded mt-4">
            {loading ? "Saving..." : "Save Patient"}
          </button>

        </form>

        {/* ================= SAVED ================= */}
        <div className="mt-10">
          <h2 className="text-xl font-bold mb-3">Saved Patients</h2>

          <button onClick={selectAll} className="mr-2 bg-gray-200 px-3 py-1">
            Select All
          </button>

          <button onClick={exportPDF} className="mr-2 bg-black text-white px-3 py-1">
            Export PDF
          </button>

          <button onClick={exportExcel} className="bg-gray-700 text-white px-3 py-1">
            Export Excel
          </button>

          <div className="mt-4 space-y-2">
            {patients.map((p) => (
              <div key={p.id} className="border p-3 flex justify-between">
                <div>
                  <b>{p.data.name}</b> ({p.data.age})
                </div>
                <input
                  type="checkbox"
                  checked={selectedIds.includes(p.id)}
                  onChange={() => toggleSelect(p.id)}
                />
              </div>
            ))}
          </div>
        </div>

      </div>
    </main>
  );
}