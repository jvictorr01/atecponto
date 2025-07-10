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
exports.RegisterForm = void 0;
var react_1 = require("react");
var button_1 = require("@/components/ui/button");
var input_1 = require("@/components/ui/input");
var label_1 = require("@/components/ui/label");
var card_1 = require("@/components/ui/card");
var auth_context_1 = require("@/contexts/auth-context");
var use_toast_1 = require("@/hooks/use-toast");
function RegisterForm(_a) {
    var _this = this;
    var onToggle = _a.onToggle;
    var _b = react_1.useState({
        email: "",
        cnpj: "",
        whatsapp: "",
        password: "",
        confirmPassword: ""
    }), formData = _b[0], setFormData = _b[1];
    var _c = react_1.useState(false), loading = _c[0], setLoading = _c[1];
    var register = auth_context_1.useAuth().register;
    var toast = use_toast_1.useToast().toast;
    var handleSubmit = function (e) { return __awaiter(_this, void 0, void 0, function () {
        var error;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    e.preventDefault();
                    if (formData.password !== formData.confirmPassword) {
                        toast({
                            title: "Erro",
                            description: "As senhas não coincidem",
                            variant: "destructive"
                        });
                        return [2 /*return*/];
                    }
                    setLoading(true);
                    return [4 /*yield*/, register(formData)];
                case 1:
                    error = (_a.sent()).error;
                    if (error) {
                        toast({
                            title: "Erro ao criar conta",
                            description: error,
                            variant: "destructive"
                        });
                    }
                    else {
                        toast({
                            title: "Conta criada com sucesso!",
                            description: "Agora você pode criar sua empresa"
                        });
                    }
                    setLoading(false);
                    return [2 /*return*/];
            }
        });
    }); };
    var handleInputChange = function (field, value) {
        setFormData(function (prev) {
            var _a;
            return (__assign(__assign({}, prev), (_a = {}, _a[field] = value, _a)));
        });
    };
    var formatCNPJ = function (value) {
        var numbers = value.replace(/\D/g, "");
        return numbers.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5");
    };
    var formatWhatsApp = function (value) {
        var numbers = value.replace(/\D/g, "");
        return numbers.replace(/^(\d{2})(\d{5})(\d{4})$/, "($1) $2-$3");
    };
    return (React.createElement(card_1.Card, { className: "w-full" },
        React.createElement(card_1.CardHeader, { className: "text-center" },
            React.createElement("div", { className: "flex justify-center mb-4" },
                React.createElement("img", { src: "https://i.imgur.com/VnLUASy.jpeg", alt: "Atec Ponto", className: "h-32 w-auto" })),
            React.createElement(card_1.CardTitle, { className: "text-2xl font-bold text-gray-900" }, "Criar Conta"),
            React.createElement(card_1.CardDescription, null, "Cadastre-se para come\u00E7ar a usar o Ponto Digital")),
        React.createElement(card_1.CardContent, null,
            React.createElement("form", { onSubmit: handleSubmit, className: "space-y-4" },
                React.createElement("div", { className: "space-y-2" },
                    React.createElement(label_1.Label, { htmlFor: "email" }, "Email"),
                    React.createElement(input_1.Input, { id: "email", type: "email", placeholder: "seu@email.com", value: formData.email, onChange: function (e) { return handleInputChange("email", e.target.value); }, required: true })),
                React.createElement("div", { className: "space-y-2" },
                    React.createElement(label_1.Label, { htmlFor: "cnpj" }, "CNPJ"),
                    React.createElement(input_1.Input, { id: "cnpj", placeholder: "00.000.000/0000-00", value: formData.cnpj, onChange: function (e) { return handleInputChange("cnpj", formatCNPJ(e.target.value)); }, maxLength: 18, required: true })),
                React.createElement("div", { className: "space-y-2" },
                    React.createElement(label_1.Label, { htmlFor: "whatsapp" }, "WhatsApp"),
                    React.createElement(input_1.Input, { id: "whatsapp", placeholder: "(00) 00000-0000", value: formData.whatsapp, onChange: function (e) { return handleInputChange("whatsapp", formatWhatsApp(e.target.value)); }, maxLength: 15, required: true })),
                React.createElement("div", { className: "space-y-2" },
                    React.createElement(label_1.Label, { htmlFor: "password" }, "Senha"),
                    React.createElement(input_1.Input, { id: "password", type: "password", placeholder: "Sua senha", value: formData.password, onChange: function (e) { return handleInputChange("password", e.target.value); }, required: true })),
                React.createElement("div", { className: "space-y-2" },
                    React.createElement(label_1.Label, { htmlFor: "confirmPassword" }, "Confirmar Senha"),
                    React.createElement(input_1.Input, { id: "confirmPassword", type: "password", placeholder: "Confirme sua senha", value: formData.confirmPassword, onChange: function (e) { return handleInputChange("confirmPassword", e.target.value); }, required: true })),
                React.createElement(button_1.Button, { type: "submit", className: "w-full", disabled: loading }, loading ? "Criando conta..." : "Criar Conta")),
            React.createElement("div", { className: "mt-4 text-center" },
                React.createElement("p", { className: "text-sm text-gray-600" },
                    "J\u00E1 tem uma conta?",
                    " ",
                    React.createElement("button", { onClick: onToggle, className: "text-[#09893E] hover:underline font-medium" }, "Fa\u00E7a login"))))));
}
exports.RegisterForm = RegisterForm;
