import React, { useMemo } from "react";
import ReactFlow, {
  Background,
  Controls,
  Panel,
  MarkerType,
  useNodesState,
  useEdgesState,
} from "reactflow";
import "reactflow/dist/style.css";

// Custom Node Component
const MemberNode = ({ data }) => {
  const { member, alive } = data;

  return (
    <div
      className={`p-4 rounded-2xl shadow-lg border-2 transition-all hover:scale-105 ${
        alive
          ? "bg-white border-indigo-100"
          : "bg-slate-50 border-slate-200 grayscale-[0.5]"
      }`}
    >
      <div className="flex items-center gap-3">
        {member.photoUrl ? (
          <img
            src={member.photoUrl}
            alt={member.name}
            className="w-12 h-12 rounded-xl object-cover border border-slate-100 shadow-sm"
          />
        ) : (
          <div
            className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl font-black text-white ${
              member.gender === "Female" ? "bg-pink-500" : "bg-indigo-500"
            }`}
          >
            {member.name?.charAt(0)}
          </div>
        )}
        <div className="flex-1 min-w-[120px]">
          <h4 className="text-slate-800 font-bold text-sm leading-tight flex items-center gap-1.5">
            {member.name}
            {!alive && (
              <span className="w-2 h-2 rounded-full bg-slate-400"></span>
            )}
          </h4>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-[9px] font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded uppercase tracking-tighter">
              {member.displayId || member.uniqueId}
            </span>
            <span className="text-[9px] font-bold text-slate-500 italic">
              Gen {member.generation}
            </span>
          </div>
          {member.profession && (
            <p className="text-[10px] text-slate-400 mt-1 font-medium truncate">
              {member.profession}
            </p>
          )}
        </div>
      </div>

      {!alive && (
        <div className="absolute top-2 right-2 text-[10px] font-bold text-slate-300 italic">
          মৃত
        </div>
      )}
    </div>
  );
};

const nodeTypes = {
  member: MemberNode,
};

export default function FamilyTreeView({ members }) {
  // Convert members to React Flow nodes and edges
  const { initialNodes, initialEdges } = useMemo(() => {
    const nodes = [];
    const edges = [];

    // Sort members by generation and then by name for consistent layout
    const membersByGen = {};
    members.forEach((m) => {
      const gen = m.generation || 1;
      if (!membersByGen[gen]) membersByGen[gen] = [];
      membersByGen[gen].push(m);
    });

    const HORIZONTAL_GAP = 250;
    const VERTICAL_GAP = 200;

    Object.keys(membersByGen).forEach((gen) => {
      const g = parseInt(gen);
      const rowMembers = membersByGen[g];
      const rowWidth = (rowMembers.length - 1) * HORIZONTAL_GAP;

      rowMembers.forEach((m, idx) => {
        const x = idx * HORIZONTAL_GAP - rowWidth / 2;
        const y = (g - 1) * VERTICAL_GAP;

        nodes.push({
          id: m.uniqueId,
          type: "member",
          position: { x, y },
          data: { member: m, alive: m.alive !== false },
        });

        // Add edges to parents
        if (m.fatherId) {
          edges.push({
            id: `e-${m.fatherId}-${m.uniqueId}`,
            source: m.fatherId,
            target: m.uniqueId,
            animated: true,
            style: { stroke: "#6366f1", strokeWidth: 2 },
            markerEnd: { type: MarkerType.ArrowClosed, color: "#6366f1" },
          });
        }
        if (m.motherId) {
          edges.push({
            id: `e-${m.motherId}-${m.uniqueId}`,
            source: m.motherId,
            target: m.uniqueId,
            animated: true,
            style: {
              stroke: "#ec4899",
              strokeWidth: 2,
              strokeDasharray: "5,5",
            },
            markerEnd: { type: MarkerType.ArrowClosed, color: "#ec4899" },
          });
        }
      });
    });

    return { initialNodes: nodes, initialEdges: edges };
  }, [members]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Update nodes/edges if members change
  React.useEffect(() => {
    setNodes(initialNodes);
    setEdges(initialEdges);
  }, [initialNodes, initialEdges, setNodes, setEdges]);

  return (
    <div className="bg-white rounded-3xl p-4 shadow-xl border border-slate-100 h-[700px] relative overflow-hidden">
      {/* Decorative patterns */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50/50 rounded-full blur-3xl -mr-32 -mt-32"></div>
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-slate-50/50 rounded-full blur-3xl -ml-32 -mb-32"></div>

      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        fitView
      >
        <Background color="#f1f5f9" gap={20} />
        <Controls />
        <Panel
          position="top-left"
          className="bg-white/80 backdrop-blur-md p-4 rounded-2xl border border-slate-100 shadow-sm mt-4 ml-4"
        >
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            🌳 ফ্যামিলি ট্রি নেটওয়ার্ক
          </h3>
          <p className="text-slate-400 text-[10px] mt-1 font-bold uppercase tracking-widest">
            ইন্টারেক্টিভ ড্র্যাগ ও জুম ভিউ
          </p>

          <div className="flex gap-4 mt-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-1 bg-indigo-500 rounded-full"></div>
              <span className="text-[10px] font-bold text-slate-500">পিতা</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-1 bg-pink-500 rounded-full border-t border-dashed"></div>
              <span className="text-[10px] font-bold text-slate-500">মাতা</span>
            </div>
          </div>
        </Panel>
      </ReactFlow>
    </div>
  );
}
