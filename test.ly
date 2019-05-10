\version "2.18.2"
#(set! paper-alist (cons '("my size" . (cons (* 110 mm) (* 30 mm))) paper-alist))

\header { 
  tagline = ""  % removed 
} 

\paper {
  #(set-paper-size "my size")
}
\layout {
  \context {
    \Staff
    \remove 
"Time_signature_engraver"
  }
}
{
\time 8/16
\clef treble
\times 2/3{a'16a'16a'16}  \times 3/2{a'8a'8}
\bar"||"
}