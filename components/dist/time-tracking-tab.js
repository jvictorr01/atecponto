"use client";
"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
exports.__esModule = true;
exports.TimeTrackingTab = void 0;
var react_1 = require("react");
var button_1 = require("@/components/ui/button");
var input_1 = require("@/components/ui/input");
var label_1 = require("@/components/ui/label");
var card_1 = require("@/components/ui/card");
var auth_context_1 = require("@/contexts/auth-context");
var use_toast_1 = require("@/hooks/use-toast");
var supabase_1 = require("@/lib/supabase");
var lucide_react_1 = require("lucide-react");
var DAYS_OF_WEEK = [
    "Domingo",
    "Segunda-feira",
    "Terça-feira",
    "Quarta-feira",
    "Quinta-feira",
    "Sexta-feira",
    "Sábado",
];
function TimeTrackingTab() {
    var _this = this;
    var _a = react_1.useState([]), schedules = _a[0], setSchedules = _a[1];
    var _b = react_1.useState(true), loading = _b[0], setLoading = _b[1];
    var _c = react_1.useState(false), saving = _c[0], setSaving = _c[1];
    var user = auth_context_1.useAuth().user;
    var toast = use_toast_1.useToast().toast;
    react_1.useEffect(function () {
        loadSchedules();
    }, [user]);
    var loadSchedules = function () { return __awaiter(_this, void 0, void 0, function () {
        var company, schedulesData, allSchedules, _loop_1, i, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!user)
                        return [2 /*return*/];
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 5, 6, 7]);
                    return [4 /*yield*/, supabase_1.supabase.from("companies").select("id").eq("user_id", user.id).single()];
                case 2:
                    company = (_a.sent()).data;
                    if (!company) return [3 /*break*/, 4];
                    return [4 /*yield*/, supabase_1.supabase
                            .from("work_schedules")
                            .select("*")
                            .eq("company_id", company.id)
                            .order("day_of_week")
                        // Criar array com todos os dias da semana
                    ];
                case 3:
                    schedulesData = (_a.sent()).data;
                    allSchedules = [];
                    _loop_1 = function (i) {
                        var existingSchedule = schedulesData === null || schedulesData === void 0 ? void 0 : schedulesData.find(function (s) { return s.day_of_week === i; });
                        allSchedules.push({
                            id: existingSchedule === null || existingSchedule === void 0 ? void 0 : existingSchedule.id,
                            day_of_week: i,
                            entry_time: (existingSchedule === null || existingSchedule === void 0 ? void 0 : existingSchedule.entry_time) || "",
                            lunch_start: (existingSchedule === null || existingSchedule === void 0 ? void 0 : existingSchedule.lunch_start) || "",
                            lunch_end: (existingSchedule === null || existingSchedule === void 0 ? void 0 : existingSchedule.lunch_end) || "",
                            exit_time: (existingSchedule === null || existingSchedule === void 0 ? void 0 : existingSchedule.exit_time) || ""
                        });
                    };
                    for (i = 0; i < 7; i++) {
                        _loop_1(i);
                    }
                    setSchedules(allSchedules);
                    _a.label = 4;
                case 4: return [3 /*break*/, 7];
                case 5:
                    error_1 = _a.sent();
                    console.error("Erro ao carregar horários:", error_1);
                    return [3 /*break*/, 7];
                case 6:
                    setLoading(false);
                    return [7 /*endfinally*/];
                case 7: return [2 /*return*/];
            }
        });
    }); };
    var handleScheduleChange = function (dayIndex, field, value) {
        setSchedules(function (prev) {
            return prev.map(function (schedule) {
                var _a;
                return (schedule.day_of_week === dayIndex ? __assign(__assign({}, schedule), (_a = {}, _a[field] = value, _a)) : schedule);
            });
        });
    };
    var saveSchedule = function (dayIndex) { return __awaiter(_this, void 0, void 0, function () {
        var company, schedule, error, _a, data_1, error, error_2;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    if (!user)
                        return [2 /*return*/];
                    setSaving(true);
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 7, 8, 9]);
                    return [4 /*yield*/, supabase_1.supabase.from("companies").select("id").eq("user_id", user.id).single()];
                case 2:
                    company = (_b.sent()).data;
                    if (!company)
                        return [2 /*return*/];
                    schedule = schedules[dayIndex];
                    if (!schedule.id) return [3 /*break*/, 4];
                    return [4 /*yield*/, supabase_1.supabase
                            .from("work_schedules")
                            .update({
                            entry_time: schedule.entry_time || null,
                            lunch_start: schedule.lunch_start || null,
                            lunch_end: schedule.lunch_end || null,
                            exit_time: schedule.exit_time || null
                        })
                            .eq("id", schedule.id)];
                case 3:
                    error = (_b.sent()).error;
                    if (error)
                        throw error;
                    return [3 /*break*/, 6];
                case 4: return [4 /*yield*/, supabase_1.supabase
                        .from("work_schedules")
                        .insert({
                        company_id: company.id,
                        day_of_week: dayIndex,
                        entry_time: schedule.entry_time || null,
                        lunch_start: schedule.lunch_start || null,
                        lunch_end: schedule.lunch_end || null,
                        exit_time: schedule.exit_time || null
                    })
                        .select()
                        .single()];
                case 5:
                    _a = _b.sent(), data_1 = _a.data, error = _a.error;
                    if (error)
                        throw error;
                    // Atualizar o ID no estado
                    setSchedules(function (prev) { return prev.map(function (s) { return (s.day_of_week === dayIndex ? __assign(__assign({}, s), { id: data_1.id }) : s); }); });
                    _b.label = 6;
                case 6:
                    toast({
                        title: "Horário salvo",
                        description: "Hor\u00E1rio de " + DAYS_OF_WEEK[dayIndex].toLowerCase() + " salvo com sucesso"
                    });
                    return [3 /*break*/, 9];
                case 7:
                    error_2 = _b.sent();
                    toast({
                        title: "Erro",
                        description: "Erro ao salvar horário",
                        variant: "destructive"
                    });
                    return [3 /*break*/, 9];
                case 8:
                    setSaving(false);
                    return [7 /*endfinally*/];
                case 9: return [2 /*return*/];
            }
        });
    }); };
    if (loading) {
        return React.createElement("div", { className: "text-center py-8" }, "Carregando hor\u00E1rios...");
    }
    return (React.createElement("div", { className: "space-y-6" },
        React.createElement(card_1.Card, null,
            React.createElement(card_1.CardHeader, null,
                React.createElement(card_1.CardTitle, { className: "flex items-center" },
                    React.createElement(lucide_react_1.Clock, { className: "h-5 w-5 mr-2" }),
                    "Configura\u00E7\u00E3o de Carga Hor\u00E1ria")),
            React.createElement(card_1.CardContent, null,
                React.createElement("p", { className: "text-sm text-gray-600 mb-6" }, "Configure os hor\u00E1rios de trabalho para cada dia da semana. Deixe em branco os campos dos dias que n\u00E3o h\u00E1 expediente."),
                React.createElement("div", { className: "space-y-6" }, schedules.map(function (schedule, index) { return (React.createElement(card_1.Card, { key: index, className: "border-l-4 border-l-[#09893E]" },
                    React.createElement(card_1.CardHeader, { className: "pb-3" },
                        React.createElement(card_1.CardTitle, { className: "text-lg" }, DAYS_OF_WEEK[index])),
                    React.createElement(card_1.CardContent, null,
                        React.createElement("div", { className: "grid grid-cols-1 md:grid-cols-4 gap-4 mb-4" },
                            React.createElement("div", { className: "space-y-2" },
                                React.createElement(label_1.Label, { htmlFor: "entry-" + index }, "Entrada"),
                                React.createElement(input_1.Input, { id: "entry-" + index, type: "time", value: schedule.entry_time, onChange: function (e) { return handleScheduleChange(index, "entry_time", e.target.value); } })),
                            React.createElement("div", { className: "space-y-2" },
                                React.createElement(label_1.Label, { htmlFor: "lunch-start-" + index }, "In\u00EDcio Almo\u00E7o"),
                                React.createElement(input_1.Input, { id: "lunch-start-" + index, type: "time", value: schedule.lunch_start, onChange: function (e) { return handleScheduleChange(index, "lunch_start", e.target.value); } })),
                            React.createElement("div", { className: "space-y-2" },
                                React.createElement(label_1.Label, { htmlFor: "lunch-end-" + index }, "Fim Almo\u00E7o"),
                                React.createElement(input_1.Input, { id: "lunch-end-" + index, type: "time", value: schedule.lunch_end, onChange: function (e) { return handleScheduleChange(index, "lunch_end", e.target.value); } })),
                            React.createElement("div", { className: "space-y-2" },
                                React.createElement(label_1.Label, { htmlFor: "exit-" + index }, "Sa\u00EDda"),
                                React.createElement(input_1.Input, { id: "exit-" + index, type: "time", value: schedule.exit_time, onChange: function (e) { return handleScheduleChange(index, "exit_time", e.target.value); } }))),
                        React.createElement(button_1.Button, { onClick: function () { return saveSchedule(index); }, disabled: saving, size: "sm" },
                            React.createElement(lucide_react_1.Save, { className: "h-4 w-4 mr-2" }),
                            "Salvar ",
                            DAYS_OF_WEEK[index])))); })))),
        React.createElement(card_1.Card, null,
            React.createElement(card_1.CardHeader, null,
                React.createElement(card_1.CardTitle, null, "Como funciona o c\u00E1lculo de horas")),
            React.createElement(card_1.CardContent, null,
                React.createElement("div", { className: "space-y-3 text-sm" },
                    React.createElement("div", { className: "flex items-start space-x-2" },
                        React.createElement("div", { className: "w-2 h-2 bg-green-500 rounded-full mt-2" }),
                        React.createElement("p", null,
                            React.createElement("strong", null, "Horas Extras:"),
                            " Quando o funcion\u00E1rio registra ponto antes do hor\u00E1rio definido")),
                    React.createElement("div", { className: "flex items-start space-x-2" },
                        React.createElement("div", { className: "w-2 h-2 bg-red-500 rounded-full mt-2" }),
                        React.createElement("p", null,
                            React.createElement("strong", null, "Faltas:"),
                            " Quando o funcion\u00E1rio registra ponto depois do hor\u00E1rio definido")),
                    React.createElement("div", { className: "flex items-start space-x-2" },
                        React.createElement("div", { className: "w-2 h-2 bg-yellow-500 rounded-full mt-2" }),
                        React.createElement("p", null,
                            React.createElement("strong", null, "Falta Total:"),
                            " Quando o funcion\u00E1rio n\u00E3o registra ponto")),
                    React.createElement("div", { className: "flex items-start space-x-2" },
                        React.createElement("div", { className: "w-2 h-2 bg-gray-500 rounded-full mt-2" }),
                        React.createElement("p", null,
                            React.createElement("strong", null, "Dias sem configura\u00E7\u00E3o:"),
                            " N\u00E3o s\u00E3o contabilizados no c\u00E1lculo")))))));
}
exports.TimeTrackingTab = TimeTrackingTab;
