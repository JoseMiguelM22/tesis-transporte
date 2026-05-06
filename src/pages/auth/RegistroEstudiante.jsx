import React, { useState, useMemo } from "react";
import {
  User, Mail, Lock, CreditCard, Phone,
  Eye, EyeOff, ArrowLeft, AlertCircle, CheckCircle, XCircle
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from '../../lib/supabase';
import { InputIcon } from "../../components/InputIcon";

export default function Register() {
  const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    nombre: '', apellido: '', cedula: '', telefono: '', email: '', password: ''
  });

  // 🔔 helper alerta
  const showMessage = (msg, time = 4000) => {
    setErrorMsg(msg);
    setTimeout(() => setErrorMsg(""), time);
  };

  // ✏️ cambios input
  const handleChange = (e) => {
    const { name, value } = e.target;
    let val = value;

    if (name === 'nombre' || name === 'apellido')
      val = value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, "");

    if (name === 'cedula' || name === 'telefono')
      val = value.replace(/\D/g, "");

    if (name === 'password')
      val = value.replace(/[^a-zA-Z0-9]/g, "");

    setFormData({ ...formData, [name]: val });
  };

  // ✅ VALIDACIONES EN TIEMPO REAL
  const validations = useMemo(() => {
    const { nombre, apellido, email, password } = formData;

    return {
      nombre: nombre.length >= 3,
      apellido: apellido.length >= 3,
      email: email.includes("@") && email.length >= 10,
      passwordLength: password.length >= 8,
      passwordUpper: /[A-Z]/.test(password),
      passwordLower: /[a-z]/.test(password),
      passwordNumber: /\d/.test(password)
    };
  }, [formData]);

  const handleRegister = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    const { email, password, cedula, nombre, apellido, telefono } = formData;

    if (!validations.email) return showMessage("Email inválido");
    if (!Object.values(validations).every(v => v))
      return showMessage("Completa correctamente los campos");

    setLoading(true);

    try {
      // verificar duplicados
      const { data: existe, error: eCheck } = await supabase
        .from('perfiles')
        .select('cedula, email, telefono')
        .or(`cedula.eq.${cedula},email.eq.${email.toLowerCase()},telefono.eq.${telefono}`)
        .maybeSingle();

      if (eCheck) throw eCheck;

      if (existe) {
        if (existe.cedula === cedula) return showMessage("La cédula ya está registrada.");
        if (existe.email === email.toLowerCase()) return showMessage("El correo ya está en uso.");
        if (existe.telefono === telefono) return showMessage("El teléfono ya está registrado.");
      }

      const { data: auth, error: aErr } = await supabase.auth.signUp({ email, password });
      if (aErr) throw aErr;

      if (auth.user) {
        const { error: pErr } = await supabase.from('perfiles').insert([{
          id: auth.user.id,
          nombre: nombre.trim(),
          apellido: apellido.trim(),
          cedula,
          telefono,
          email: email.toLowerCase().trim(),
          rol: 'estudiante'
        }]);

        if (pErr) throw pErr;

        showMessage("¡Registro exitoso!");
        setTimeout(() => navigate("/login"), 1500);
      }

    } catch (err) {
      showMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

 const CheckItem = ({ ok, text }) => (
  <div className="flex items-center gap-1 text-[11px]">
    {ok ? (
      <CheckCircle className="text-green-400 w-3.5 h-3.5" />
    ) : (
      <XCircle className="text-red-400 w-3.5 h-3.5" />
    )}
    <span className={ok ? "text-green-300" : "text-red-300"}>
      {text}
    </span>
  </div>
);

  return (
    <div className="min-h-screen bg-[#1566D0] flex items-center justify-center px-4 py-8 text-white relative overflow-hidden">

      {/* 🔵 FONDO */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-blue-300/20 blur-3xl rounded-full" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-white/10 blur-3xl rounded-full" />

      {/* LOGOS */}
      <div className="hidden xl:flex absolute left-12 top-1/2 -translate-y-1/2 opacity-10">
        <img src="/logotrans.jpeg" className="w-72 h-72 rounded-full" />
      </div>

      <div className="hidden xl:flex absolute right-12 top-1/2 -translate-y-1/2 opacity-10">
        <img src="/logotrans.jpeg" className="w-72 h-72 rounded-full" />
      </div>

      {/* ALERTA */}
      {errorMsg && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 w-[90%] max-w-md z-50 flex items-center gap-2 rounded-2xl border border-red-400 bg-red-500 px-4 py-3 text-sm shadow-lg">
          <AlertCircle className="w-4 h-4" />
          {errorMsg}
        </div>
      )}

      {/* CARD */}
      <div className="relative z-10 w-full max-w-md backdrop-blur-xl bg-white/10 border border-white/15 rounded-[32px] p-8 shadow-2xl">

        <Link to="/login" className="inline-flex items-center text-xs text-white/70 mb-6">
          <ArrowLeft className="w-4 h-4 mr-1" /> Volver
        </Link>

        <h2 className="text-3xl font-extrabold text-center mb-6">Registro</h2>

        <form onSubmit={handleRegister} className="space-y-4">

          <div className="grid grid-cols-2 gap-3">
            <InputIcon icon={<User size={18}/>} name="nombre" placeholder="Nombre" val={formData.nombre} change={handleChange}/>
            <InputIcon icon={<User size={18}/>} name="apellido" placeholder="Apellido" val={formData.apellido} change={handleChange}/>
          </div>

          <InputIcon icon={<CreditCard size={18}/>} name="cedula" placeholder="Cédula" val={formData.cedula} change={handleChange}/>
          <InputIcon icon={<Phone size={18}/>} name="telefono" placeholder="Teléfono" val={formData.telefono} change={handleChange}/>
          <InputIcon icon={<Mail size={18}/>} name="email" placeholder="Correo" val={formData.email} change={handleChange}/>

          {/* PASSWORD */}
          <div className="space-y-2">
                <div className="flex items-center bg-white/5 rounded-2xl px-4 py-3 border border-white/10 focus-within:border-white/40 transition-all">
                  <Lock className="w-5 h-5 mr-3 opacity-40" />

                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    placeholder="Contraseña"
                    className="bg-transparent w-full outline-none text-sm"
                    value={formData.password}
                    onChange={handleChange}
                  />

                  <button type="button" onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? <EyeOff size={16}/> : <Eye size={16}/>}
                  </button>
                </div>

                {/* ✅ CHECKS EN GRID */}
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 px-1">
                  <CheckItem ok={validations.passwordLength} text="8 caracteres" />
                  <CheckItem ok={validations.passwordUpper} text="Mayúscula" />
                  <CheckItem ok={validations.passwordLower} text="Minúscula" />
                  <CheckItem ok={validations.passwordNumber} text="Número" />
                </div>
              </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-white text-[#1566D0] py-3 rounded-2xl font-bold mt-4"
          >
            {loading ? "VALIDANDO..." : "CREAR CUENTA"}
          </button>
        </form>
      </div>
    </div>
  );
}