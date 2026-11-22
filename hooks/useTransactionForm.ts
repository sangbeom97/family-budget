"use client";

import { useState } from "react";

export function useTransactionForm() {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [name, setName] = useState("");
  const [memo, setMemo] = useState("");
  const [amount, setAmount] = useState("");
  const [type, setType] = useState("expense");
  const [category, setCategory] = useState("");
  const [spendType, setSpendType] = useState("variable");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);

  return {
    editingId,
    setEditingId,
    name,
    setName,
    memo,
    setMemo,
    amount,
    setAmount,
    type,
    setType,
    category,
    setCategory,
    spendType,
    setSpendType,
    date,
    setDate,
  };
}
