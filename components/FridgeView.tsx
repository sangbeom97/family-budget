"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type FridgeItem = {
  id: number;
  name: string;
  quantity: number;
  category: string;
  storage_type: string;
  expire_date: string;
};

export default function FridgeView() {
  const [items, setItems] =
    useState<FridgeItem[]>([]);

  const [name, setName] =
    useState("");

  const [quantity, setQuantity] =
    useState("1");

  const [category, setCategory] =
    useState("육류");

  const [storageType, setStorageType] =
    useState("fridge");

  const [expireDate, setExpireDate] =
    useState("");

  const [filter, setFilter] =
    useState("all");

  const [editId, setEditId] =
    useState<number | null>(
      null
    );

  const categories = [
    "육류",
    "채소",
    "유제품",
    "음료",
    "냉동식품",
    "반찬",
    "소스",
    "간편식",
    "기타",
  ];

  // 데이터 불러오기
  const fetchItems = async () => {
    const { data, error } =
      await supabase
        .from("fridge_items")
        .select("*")
        .order("expire_date", {
          ascending: true,
        });

    if (error) {
      console.log(error);
      return;
    }

    setItems(data || []);
  };

  useEffect(() => {
    fetchItems();
  }, []);

  // 추가
  const addItem = async () => {
    if (
      !name ||
      !expireDate
    ) {
      return;
    }

    const { error } =
      await supabase
        .from("fridge_items")
        .insert([
          {
            name,
            quantity:
              Number(quantity),
            category,
            storage_type:
              storageType,
            expire_date:
              expireDate,
          },
        ]);

    if (error) {
      console.log(error);
      return;
    }

    setName("");

    setQuantity("1");

    setExpireDate("");

    fetchItems();
  };

  // 수정 시작
  const startEdit = (
    item: FridgeItem
  ) => {
    setEditId(item.id);

    setName(item.name);

    setQuantity(
      item.quantity.toString()
    );

    setCategory(item.category);

    setStorageType(
      item.storage_type
    );

    setExpireDate(
      item.expire_date
    );
  };

  // 수정 저장
  const updateItem = async () => {
    if (!editId) return;

    const { error } =
      await supabase
        .from("fridge_items")
        .update({
          name,
          quantity:
            Number(quantity),
          category,
          storage_type:
            storageType,
          expire_date:
            expireDate,
        })
        .eq("id", editId);

    if (error) {
      console.log(error);
      return;
    }

    setEditId(null);

    setName("");

    setQuantity("1");

    setExpireDate("");

    fetchItems();
  };

  // 삭제
  const deleteItem = async (
    id: number
  ) => {
    const { error } =
      await supabase
        .from("fridge_items")
        .delete()
        .eq("id", id);

    if (error) {
      console.log(error);
      return;
    }

    fetchItems();
  };

  // D-day 계산
  const getDDay = (
    date: string
  ) => {
    const today = new Date();

    const expire =
      new Date(date);

    const diff = Math.ceil(
      (expire.getTime() -
        today.getTime()) /
        (1000 *
          60 *
          60 *
          24)
    );

    if (diff < 0)
      return "만료";

    if (diff === 0)
      return "오늘";

    return `D-${diff}`;
  };

  // 필터
  const filteredItems =
    filter === "all"
      ? items
      : items.filter(
          (item) =>
            item.storage_type ===
            filter
        );

  return (
    <div>
      {/* 필터 */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {[
          ["all", "전체"],
          ["fridge", "냉장"],
          ["freezer", "냉동"],
          ["room", "실온"],
        ].map(
          ([value, label]) => (
            <button
              key={value}
              onClick={() =>
                setFilter(value)
              }
              className={`px-3 py-2 rounded-xl font-medium ${
                filter === value
                  ? "bg-black text-white"
                  : "bg-white text-gray-700"
              }`}
            >
              {label}
            </button>
          )
        )}
      </div>

      {/* 입력 */}
      <div className="bg-white rounded-2xl p-5 shadow mb-4">
        <h3 className="font-semibold mb-4 text-gray-800">
          {editId
            ? "재고 수정"
            : "냉장고 재고 추가"}
        </h3>

        <div className="grid md:grid-cols-5 gap-3">
          <input
            type="text"
            placeholder="식품명"
            value={name}
            onChange={(e) =>
              setName(
                e.target.value
              )
            }
            className="border rounded-xl px-3 py-2 text-gray-800"
          />

          <input
            type="number"
            placeholder="수량"
            value={quantity}
            onChange={(e) =>
              setQuantity(
                e.target.value
              )
            }
            className="border rounded-xl px-3 py-2 text-gray-800"
          />

          <select
            value={category}
            onChange={(e) =>
              setCategory(
                e.target.value
              )
            }
            className="border rounded-xl px-3 py-2 text-gray-800"
          >
            {categories.map(
              (item) => (
                <option
                  key={item}
                >
                  {item}
                </option>
              )
            )}
          </select>

          <select
            value={storageType}
            onChange={(e) =>
              setStorageType(
                e.target.value
              )
            }
            className="border rounded-xl px-3 py-2 text-gray-800"
          >
            <option value="fridge">
              냉장
            </option>

            <option value="freezer">
              냉동
            </option>

            <option value="room">
              실온
            </option>
          </select>

          <input
            type="date"
            value={expireDate}
            onChange={(e) =>
              setExpireDate(
                e.target.value
              )
            }
            className="border rounded-xl px-3 py-2 text-gray-800"
          />
        </div>

        <button
          onClick={
            editId
              ? updateItem
              : addItem
          }
          className="w-full mt-4 bg-black text-white py-3 rounded-xl font-semibold"
        >
          {editId
            ? "수정하기"
            : "추가하기"}
        </button>
      </div>

      {/* 목록 */}
      <div className="space-y-3">
        {filteredItems.map(
          (item) => (
            <div
              key={item.id}
              className="bg-white rounded-2xl p-4 shadow flex justify-between items-center"
            >
              <div>
                <p className="font-bold text-lg">
                  {item.name}
                </p>

                <p className="text-sm text-gray-500">
                  {item.category} ·{" "}
                  {item.quantity}
                  개
                </p>

                <p className="text-sm mt-1">
                  {item.storage_type ===
                  "fridge"
                    ? "냉장"
                    : item.storage_type ===
                      "freezer"
                    ? "냉동"
                    : "실온"}
                </p>
              </div>

              <div className="text-right">
                <p
                  className={`font-bold ${
                    getDDay(
                      item.expire_date
                    ) === "만료"
                      ? "text-red-600"
                      : "text-orange-500"
                  }`}
                >
                  {getDDay(
                    item.expire_date
                  )}
                </p>

                <p className="text-sm text-gray-500">
                  {
                    item.expire_date
                  }
                </p>

                <div className="flex gap-2 mt-2 justify-end">
                  <button
                    onClick={() =>
                      startEdit(
                        item
                      )
                    }
                    className="px-3 py-1 rounded-lg bg-gray-200 text-gray-800 text-sm"
                  >
                    수정
                  </button>

                  <button
                    onClick={() =>
                      deleteItem(
                        item.id
                      )
                    }
                    className="px-3 py-1 rounded-lg bg-red-500 text-white text-sm"
                  >
                    삭제
                  </button>
                </div>
              </div>
            </div>
          )
        )}

        {filteredItems.length ===
          0 && (
          <div className="bg-white rounded-2xl p-10 shadow text-center text-gray-400">
            재고가 없습니다
          </div>
        )}
      </div>
    </div>
  );
}